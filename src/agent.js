import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { RunnableSequence, RunnableWithMessageHistory } from "@langchain/core/runnables";
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { StringOutputParser } from "@langchain/core/output_parsers";
import dotenv from "dotenv";
import pool from "./db.js";
import axios from "axios";

dotenv.config();

const model = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "llama-3.3-70b-versatile",
});

// Update prompt untuk menyertakan konteks cuaca
const prompt = ChatPromptTemplate.fromMessages([
  [
    "system",
    `Kamu adalah OutfitBot — asisten yang hanya menjawab topik seputar outfit, fashion, gaya berpakaian, warna, cuaca, dan rekomendasi pakaian. Jika user bertanya di luar topik ini, jawab dengan sopan seperti: "Maaf, aku cuma bisa bantu untuk hal-hal yang berhubungan dengan outfit atau gaya berpakaian ya"
    Gunakan gaya bahasa yang ringan, hangat, dan seperti ngobrol dengan teman.
    Jika diberikan data cuaca, gunakan untuk memberikan rekomendasi outfit yang sesuai, misalnya: "Di Jakarta lagi cerah dan panas 30°C, yuk pakai kaos tipis dan celana pendek biar adem!". Jika tidak ada data cuaca, berikan rekomendasi umum.`,
  ],
  new MessagesPlaceholder("history"),
  ["human", "{input}"],
]);

const outputParser = new StringOutputParser();
const chain = RunnableSequence.from([prompt, model, outputParser]);

const messageHistories = new Map();

// Fungsi untuk load history dari database
async function loadHistoryFromDB(userId) {
  const { rows } = await pool.query(
    `SELECT message, response FROM user_chat_history WHERE user_id = $1 ORDER BY id ASC`,
    [userId]
  );
  const history = new InMemoryChatMessageHistory();
  for (const row of rows) {
    history.addUserMessage(row.message);
    history.addAIMessage(row.response);
  }
  messageHistories.set(userId, history);
  return history;
}

// Pastikan chainWithHistory didefinisikan sebelum askLLM
const chainWithHistory = new RunnableWithMessageHistory({
  runnable: chain,
  getMessageHistory: async (sessionId) => {
    if (!messageHistories.has(sessionId)) {
      console.log(`Loading chat history for ${sessionId} from DB...`);
      await loadHistoryFromDB(sessionId);
    }
    return messageHistories.get(sessionId);
  },
  inputMessagesKey: "input",
  historyMessagesKey: "history",
});

// Fungsi untuk parse lokasi dari promptText (diperbarui)
function parseLocation(promptText) {
  const match = promptText.match(/(di|untuk|lokasi)\s+([a-zA-Z]+(?:\s+[a-zA-Z]+)*?)(?:\s|$|[.,!?])/i);
  return match ? match[2].trim() : null;
}

// Fungsi baru untuk fetch data cuaca
async function getWeatherData(city) {
  try {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey) {
      console.error("WEATHER_API_KEY tidak ditemukan di .env");
      return null;
    }
    
    let url = `https://api.openweathermap.org/data/2.5/weather?q=${city},ID&appid=${apiKey}&units=metric&lang=id`;
    console.log(`Fetching weather for: ${city} (with ,ID)`);
    
    let response = await axios.get(url);
    if (response.status !== 200) {
      throw new Error(`API response status: ${response.status}`);
    }
    
    const data = response.data;
    const temp = data.main.temp;
    const description = data.weather[0].description;
    const humidity = data.main.humidity;
    console.log(`Weather data fetched: ${description}, ${temp}°C, ${humidity}% humidity`);
    return `Cuaca di ${city}: ${description}, suhu ${temp}°C, kelembaban ${humidity}%.`;
  } catch (error) {
    console.error(`Error fetching weather for ${city} (with ,ID):`, error.message);
    
    try {
      const apiKey = process.env.WEATHER_API_KEY;
      const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric&lang=id`;
      console.log(`Retrying fetch for: ${city} (without ,ID)`);
      const response = await axios.get(url);
      if (response.status !== 200) {
        throw new Error(`Fallback API response status: ${response.status}`);
      }
      
      const data = response.data;
      const temp = data.main.temp;
      const description = data.weather[0].description;
      const humidity = data.main.humidity;
      console.log(`Weather data fetched (fallback): ${description}, ${temp}°C, ${humidity}% humidity`);
      return `Cuaca di ${city}: ${description}, suhu ${temp}°C, kelembaban ${humidity}%.`;
    } catch (fallbackError) {
      console.error(`Fallback also failed for ${city}:`, fallbackError.message);
      return null;
    }
  }
}

// Fungsi utama untuk menjalankan LLM
export async function askLLM(promptText, sessionId = "default") {
  console.log(`askLLM called with prompt: "${promptText}", sessionId: ${sessionId}`);
  
  // Debug: Pastikan chainWithHistory ada
  if (!chainWithHistory) {
    console.error("chainWithHistory is not defined!");
    return "Maaf, ada error internal. Coba lagi nanti!";
  }
  
  try {
    let input = promptText;
    
    const location = parseLocation(promptText);
    if (location) {
      console.log(`Detected location: "${location}"`);
      const weatherData = await getWeatherData(location);
      if (weatherData) {
        input = `${promptText}\n\nData cuaca: ${weatherData}`;
      } else {
        input = `${promptText}\n\nMaaf, gak bisa ambil data cuaca untuk ${location} (mungkin kota tidak ditemukan atau API error). Rekomendasi umum aja ya!`;
      }
    } else {
      console.log("No location detected in prompt");
      input = `${promptText}\n\nTidak ada lokasi yang disebutkan, jadi rekomendasi umum.`;
    }
    
    const response = await chainWithHistory.invoke(
      { input },
      { configurable: { sessionId } }
    );
    
    return response;
  } catch (error) {
    console.error("Error from LangChain + Groq:", error);
    return "Terjadi kesalahan saat memproses permintaan.";
  }
}
