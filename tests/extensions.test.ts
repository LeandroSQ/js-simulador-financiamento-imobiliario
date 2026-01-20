const mockGetElementById = jest.fn();
if (typeof (globalThis as any).document === 'undefined') {
    (globalThis as any).document = {
        getElementById: mockGetElementById,
    };
} else {
    // If we are in jsdom, we can still spy on it, but the extension modifies the global document object directly
    jest.spyOn(document, 'getElementById').mockImplementation(mockGetElementById);
}

// We need to import the extensions AFTER setting up the globals they modify/access
import "../src/scripts/extensions/index";

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
    });

    describe("Document.prototype.getElementByIdOrThrow", () => {
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
