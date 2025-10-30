import pool from "../src/db.js";
import { jest } from "@jest/globals";

describe("Database Connection", () => {

  test("Pool PostgreSQL memiliki metode query", () => {
    expect(typeof pool.query).toBe("function");
  });

  test("Koneksi ke database bisa dibuat (mock test)", async () => {
    const mockResult = { rows: [] };
    pool.query = jest.fn().mockResolvedValue(mockResult);

    const result = await pool.query("SELECT * FROM user_chat_history");
    expect(result).toHaveProperty("rows");
  });
});
