import { BCBRateService } from "../src/scripts/services/bcb-rate-service";

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

// Mock localStorage/sessionStorage
const localStorageMock = (function() {
	let store: any = {};
	return {
		getItem: jest.fn((key: string) => store[key] || null),
		setItem: jest.fn((key: string, value: string) => {
			store[key] = value;
		}),
		clear: jest.fn(() => {
			store = {};
		}),
		removeItem: jest.fn((key: string) => {
			delete store[key];
		})
	};
})();

Object.defineProperty(globalThis, "localStorage", {
	value: localStorageMock,
	configurable: true
});

Object.defineProperty(globalThis, "sessionStorage", {
	value: localStorageMock,
	configurable: true
});

describe("BCBRateService - TR", () => {
	beforeEach(() => {
		mockFetch.mockClear();
		localStorageMock.getItem.mockClear();
		localStorageMock.setItem.mockClear();
		localStorageMock.clear();
	});

	test("should fetch and normalize rate from API", async () => {
		// TR API usually returns string with comma
		mockFetch.mockResolvedValueOnce({
			json: () => ([
				{
					data: "01/01/2023",
					valor: "0,15"
				}
			])
		});

		const rate = await BCBRateService.fetchTRRate(2023);

		expect(rate).toBe(0.15); // "0,15" -> 0.15
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(localStorageMock.setItem).toHaveBeenCalledWith("tr-2023", "0.15");
	});

	test("should handle dot decimal separator in API", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => ([
				{
					data: "01/01/2023",
					valor: "0.20"
				}
			])
		});

		const rate = await BCBRateService.fetchTRRate(2023);
		expect(rate).toBe(0.20);
	});

	test("should return cached value if available", async () => {
		localStorageMock.getItem.mockReturnValueOnce("0.05");

		const rate = await BCBRateService.fetchTRRate(2023);

		expect(rate).toBe(0.05);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	test("should throw error if normalized value is NaN", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => ([
				{
					data: "...",
					valor: "invalid"
				}
			])
		});

		await expect(BCBRateService.fetchTRRate(2023)).rejects.toThrow("Não foi possível obter a taxa TR para o período especificado");
	});
});
