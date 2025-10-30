import dotenv from "dotenv";
import pkg from "pg";
const { Pool } = pkg;

dotenv.config();

let pool;

if (process.env.NODE_ENV === "test") {
  const { jest } = await import("@jest/globals");
  pool = {
    connect: () => Promise.resolve(),
    query: jest.fn(), 
    end: () => Promise.resolve(),
  };
} else {
  pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: process.env.DB_PORT,
    connectionString: process.env.DATABASE_URL, 
  });

  pool
    .connect()
    .then(() => console.log("Connected to PostgreSQL"))
    .catch((err) => console.error("PostgreSQL connection error:", err));
}

export default pool;
