import { BCBRateService } from "../src/scripts/services/bcb-rate-service";

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

// Ensure debug flag exists for cache selection
(globalThis as any).DEBUG = true;

// Mock localStorage/sessionStorage
const localStorageMock = (function () {
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

Object.defineProperty(globalThis, "localStorage", { value: localStorageMock });

Object.defineProperty(globalThis, "sessionStorage", { value: localStorageMock });

describe("BCBRateService - SELIC", () => {
	beforeEach(() => {
		mockFetch.mockClear();
		localStorageMock.getItem.mockClear();
		localStorageMock.setItem.mockClear();
		localStorageMock.clear();
	});

	test("should fetch from API if not cached", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => ([
				{
					data: "01/01/2023",
					valor: 13.75
				}
			])
		});

		const rate = await BCBRateService.fetchSelicRate(2023);

		expect(rate).toBe(13.75);
		expect(mockFetch).toHaveBeenCalledTimes(1);
		expect(localStorageMock.setItem).toHaveBeenCalledWith("selic-2023", "13.75");
	});

	test("should return cached value if available", async () => {
		localStorageMock.getItem.mockReturnValueOnce("10.5");

		const rate = await BCBRateService.fetchSelicRate(2023);

		expect(rate).toBe(10.5);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	test("should fetch current year if no year provided", async () => {
		mockFetch.mockResolvedValueOnce({
			json: () => ([
				{
					data: "...",
					valor: 11.25
				}
			])
		});

		const currentYear = new Date().getFullYear();
		const rate = await BCBRateService.fetchSelicRate();

		expect(rate).toBe(11.25);
		expect(localStorageMock.setItem).toHaveBeenCalledWith(`selic-${currentYear}`, "11.25");
	});

	test("should throw error if API returns empty", async () => {
		mockFetch.mockResolvedValueOnce({ json: () => ([]) });

		await expect(BCBRateService.fetchSelicRate(2023)).rejects.toThrow("Não foi possível obter a taxa Selic para o período especificado");
	});
});
