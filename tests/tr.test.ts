import { TR } from "../src/scripts/services/tr";

// Mock global fetch
const mockFetch = jest.fn();
(globalThis as any).fetch = mockFetch;

// Mock localStorage
const localStorageMock = (function() {
  let store: any = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    })
  };
})();

// Re-defining it on globalThis might overwrite previous, which is fine for separate test files
Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true // Allow redefinition
});

describe("TR", () => {
    beforeEach(() => {
        mockFetch.mockClear();
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.clear();
    });

    test("should fetch and normalize rate from API", async () => {
        // TR API usually returns string with comma
        mockFetch.mockResolvedValueOnce({
            json: async () => ([{ data: "01/01/2023", valor: "0,15" }])
        });

        const rate = await TR.getTRRate(2023);

        expect(rate).toBe(0.15); // "0,15" -> 0.15
        expect(mockFetch).toHaveBeenCalledTimes(1);
        expect(localStorageMock.setItem).toHaveBeenCalledWith("tr-2023", "0.15");
    });

    test("should handle dot decimal separator in API", async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ([{ data: "01/01/2023", valor: "0.20" }])
        });

        const rate = await TR.getTRRate(2023);
        expect(rate).toBe(0.20);
    });

    test("should return cached value if available", async () => {
        localStorageMock.getItem.mockReturnValueOnce("0.05");

        const rate = await TR.getTRRate(2023);

        expect(rate).toBe(0.05);
        expect(mockFetch).not.toHaveBeenCalled();
    });

    test("should throw error if normalized value is NaN", async () => {
        mockFetch.mockResolvedValueOnce({
            json: async () => ([{ data: "...", valor: "invalid" }])
        });

        await expect(TR.getTRRate(2023)).rejects.toThrow("Não foi possível obter a taxa TR para o período especificado");
    });
});
