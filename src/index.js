import { Client, GatewayIntentBits } from "discord.js";
import dotenv from "dotenv";
import fs from "fs";
import pool from "./db.js"; 
import { askLLM } from "./agent.js";

dotenv.config();

// Inisialisasi bot Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once("ready", () => {
    console.log(`Bot ready! Logged in as ${client.user.tag}`);
});

// Event handler untuk setiap pesan
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    console.log(`${message.author.username}: ${message.content}`);
    fs.appendFileSync("./src/logs/chat.log", `${message.author.username}: ${message.content}\n`);

    try {
        const userId = message.author.id;
        const username = message.author.username;

        const reply = await askLLM(message.content, userId);

        // Simpan percakapan ke database
        await pool.query(
        `INSERT INTO user_chat_history (user_id, username, message, response)
        VALUES ($1, $2, $3, $4)`,
        [userId, username, message.content, reply]
        );

        await message.reply(reply);
    } catch (err) {
        console.error("Database/Chat Error:", err);
        await message.reply("Maaf, terjadi kesalahan saat memproses pesanmu.");
    }
});


client.login(process.env.DISCORD_TOKEN);
