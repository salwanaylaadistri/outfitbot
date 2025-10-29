import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();
const { Pool } = pkg;

// Koneksi pool ke PostgreSQL
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Tes koneksi
pool.connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch((err) => console.error("PostgreSQL connection error:", err));

export default pool;
