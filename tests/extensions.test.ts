const mockGetElementById = jest.fn();

if (typeof (globalThis as any).document === "undefined") {
	(globalThis as any).document = {
		getElementById: mockGetElementById
	};
} else {
	// If we are in jsdom, we can still spy on it, but the extension modifies the global document object directly
	jest.spyOn(document, "getElementById").mockImplementation(mockGetElementById);
}

// We need to import the extensions AFTER setting up the globals they modify/access
import "../src/scripts/utils/extensions/index";

describe("Extensions", () => {
	describe("Number.prototype.toCurrencyString", () => {
		test("should format currency correctly", () => {
			const val = 1234.56;
			// The result might depend on the node locale support.
			// Usually returns "R$ 1.234,56" or "R$1,234.56" depending on the implementation and full-icu.
			// But we can check if it contains "1.234,56" or "1,234.56" and "R$"
			const result = (val as any).toCurrencyString();
			expect(result).toMatch(/R\$\s?1\.234,56/);
		});

		test("should format zero", () => {
			const result = (0 as any).toCurrencyString();
			expect(result).toMatch(/R\$\s?0,00/);
		});

		test("should format negative values", () => {
			const result = (-1234.56 as any).toCurrencyString();
			expect(result).toMatch(/R\$/);
			expect(result).toMatch(/1\.234,56/);
		});

		test("should format large values", () => {
			const result = (1_000_000 as any).toCurrencyString();
			expect(result).toMatch(/R\$\s?1\.000\.000,00/);
		});
	});

	describe("Number.prototype.toShortCurrencyString", () => {
		test("should format millions with M suffix", () => {
			const result = (1_500_000 as any).toShortCurrencyString();
			expect(result).toBe("R$ 1,5M");
		});

		test("should format exact million", () => {
			const result = (1_000_000 as any).toShortCurrencyString();
			expect(result).toBe("R$ 1M");
		});

		test("should format thousands with k suffix", () => {
			const result = (150_000 as any).toShortCurrencyString();
			expect(result).toBe("R$ 150k");
		});

		test("should format exact thousand", () => {
			const result = (1_000 as any).toShortCurrencyString();
			expect(result).toBe("R$ 1k");
		});

		test("should format values under 1000 without suffix", () => {
			const result = (500 as any).toShortCurrencyString();
			expect(result).toBe("R$ 500");
		});

		test("should format zero", () => {
			const result = (0 as any).toShortCurrencyString();
			expect(result).toBe("R$ 0");
		});

		test("should handle negative millions", () => {
			const result = (-2_500_000 as any).toShortCurrencyString();
			expect(result).toBe("-R$ 2,5M");
		});

		test("should handle negative thousands", () => {
			const result = (-75_000 as any).toShortCurrencyString();
			expect(result).toBe("-R$ 75k");
		});

		test("should handle negative values under 1000", () => {
			const result = (-250 as any).toShortCurrencyString();
			expect(result).toBe("-R$ 250");
		});
	});

	describe("Math.clamp", () => {
		test("should return value when within range", () => {
			expect(Math.clamp(5, 0, 10)).toBe(5);
		});

		test("should return min when value is below range", () => {
			expect(Math.clamp(-5, 0, 10)).toBe(0);
		});

		test("should return max when value is above range", () => {
			expect(Math.clamp(15, 0, 10)).toBe(10);
		});

		test("should return boundary value at exact boundaries", () => {
			expect(Math.clamp(0, 0, 10)).toBe(0);
			expect(Math.clamp(10, 0, 10)).toBe(10);
		});

		test("should handle negative ranges", () => {
			expect(Math.clamp(-5, -10, -1)).toBe(-5);
			expect(Math.clamp(-15, -10, -1)).toBe(-10);
			expect(Math.clamp(0, -10, -1)).toBe(-1);
		});

		test("should handle floating point values", () => {
			expect(Math.clamp(0.5, 0, 1)).toBe(0.5);
			expect(Math.clamp(1.5, 0, 1)).toBe(1);
			expect(Math.clamp(-0.5, 0, 1)).toBe(0);
		});
	});


	describe("Function extensions", () => {
		beforeAll(() => {
			jest.useFakeTimers();
		});

		afterAll(() => {
			jest.useRealTimers();
		});

		test("Function.oneshot should run only once", () => {
			const mockFn = jest.fn();
			const oneshotFn = Function.oneshot(mockFn);

			oneshotFn();
			oneshotFn();
			oneshotFn();

			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		test("Function.oneshot should pass arguments", () => {
			const mockFn = jest.fn();
			const oneshotFn = Function.oneshot(mockFn);

			oneshotFn("arg1", 42);

			expect(mockFn).toHaveBeenCalledWith("arg1", 42);
		});

		test("Function.debounce should debounce calls", () => {
			const mockFn = jest.fn();
			const debouncedFn = Function.debounce(mockFn, 100);

			debouncedFn();
			debouncedFn();
			debouncedFn();

			expect(mockFn).not.toHaveBeenCalled();

			jest.advanceTimersByTime(100);

			expect(mockFn).toHaveBeenCalledTimes(1);
		});

		test("Function.debounce should reset timer on each call", () => {
			const mockFn = jest.fn();
			const debouncedFn = Function.debounce(mockFn, 100);

			debouncedFn();
			jest.advanceTimersByTime(50);

			debouncedFn();
			jest.advanceTimersByTime(50);

			expect(mockFn).not.toHaveBeenCalled();

			jest.advanceTimersByTime(50);

			expect(mockFn).toHaveBeenCalledTimes(1);
		});
	});

	describe("Document.prototype.getElementByIdOrThrow", () => {
		beforeEach(() => {
			mockGetElementById.mockClear();
		});

		test("should return element when found", () => {
			const mockElement = {};
			mockGetElementById.mockReturnValue(mockElement);

			const result = document.getElementByIdOrThrow("test-id");
			expect(result).toBe(mockElement);
			expect(mockGetElementById).toHaveBeenCalledWith("test-id");
		});

		test("should throw error when not found", () => {
			mockGetElementById.mockReturnValue(null);

			expect(() => {
				document.getElementByIdOrThrow("missing-id");
			}).toThrow("Elemento 'missing-id' não encontrado");
		});
	});
});
