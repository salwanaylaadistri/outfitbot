import { jest } from "@jest/globals";

const mockAxiosGet = jest.fn();
jest.unstable_mockModule("axios", () => ({
  default: { get: mockAxiosGet },
}));

const { default: axios } = await import("axios");
const { default: pool } = await import("../src/db.js");
const { parseLocation, getWeatherData, askLLM } = await import("../src/agent.js");

beforeEach(() => {
  pool.query = jest.fn().mockResolvedValue({ rows: [] }); 
  mockAxiosGet.mockReset();
});

describe("OutfitBot Agent Tests", () => {
  // Test 1: parseLocation menemukan lokasi dengan kata "di"
  test("parseLocation mendeteksi lokasi dari kalimat dengan 'di'", () => {
    const input = "Bagaimana outfit yang cocok di Jakarta?";
    expect(parseLocation(input)).toBe("jakarta");
  });

  // Test 2: parseLocation tidak mendeteksi lokasi jika tidak ada kata 'di'
  test("parseLocation mengembalikan null jika tidak ada lokasi", () => {
    const input = "Halo OutfitBot, apa kabar?";
    expect(parseLocation(input)).toBeNull();
  });

  // Test 3: getWeatherData berhasil mengembalikan data cuaca dari API
  test("getWeatherData mengembalikan data cuaca dari API", async () => {
    mockAxiosGet.mockResolvedValueOnce({
      status: 200,
      data: {
        main: { temp: 30, humidity: 70 },
        weather: [{ description: "cerah" }],
      },
    });

    const result = await getWeatherData("Jakarta");
    expect(result).toMatch(/Cuaca di Jakarta/);
  });

  // Test 4: getWeatherData mencoba fallback jika API pertama gagal
  test("getWeatherData mencoba fallback jika API pertama gagal", async () => {
    mockAxiosGet
      .mockRejectedValueOnce(new Error("Primary failed"))
      .mockResolvedValueOnce({
        status: 200,
        data: {
          main: { temp: 28, humidity: 65 },
          weather: [{ description: "mendung" }],
        },
      });

    const result = await getWeatherData("Bandung");
    expect(result).toContain("Cuaca di Bandung");
  });

  // Test 5: getWeatherData gagal total (semua API error)
  test("getWeatherData mengembalikan null jika semua request gagal", async () => {
    mockAxiosGet.mockRejectedValue(new Error("Network error"));
    const result = await getWeatherData("KotaTidakAda");
    expect(result).toBeNull();
  });

  // Test 6: askLLM tetap berjalan walau tanpa lokasi
  test("askLLM menghasilkan respon walau tanpa lokasi", async () => {
    const result = await askLLM("Hai, OutfitBot!", "test-session");
    expect(typeof result).toBe("string");
  });

  // Test 7: getWeatherData log error saat kedua request gagal
  test("getWeatherData mencetak error log saat kedua request gagal", async () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockAxiosGet.mockRejectedValue(new Error("API error"));

    await getWeatherData("Surabaya");
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});
