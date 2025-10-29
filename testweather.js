// testWeather.js
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

async function getWeather(location) {
  const apiKey = process.env.WEATHER_API_KEY;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&lang=id&appid=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  console.log(data);
}

getWeather("Yogyakarta");
