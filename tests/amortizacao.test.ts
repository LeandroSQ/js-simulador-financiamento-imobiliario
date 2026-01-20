import { Amortizacao, PeriodoAmortizacao } from "../src/scripts/amortizacao";

describe("Amortizacao", () => {
    describe("create", () => {
        test("should create AmortizacaoMensal", () => {
            const amortizacao = Amortizacao.create("Mensal", 12, undefined, 100);
            expect(amortizacao.constructor.name).toBe("AmortizacaoMensal");
        });

        test("should create AmortizacaoAnual", () => {
            const amortizacao = Amortizacao.create("Anual", 12, undefined, 100);
            expect(amortizacao.constructor.name).toBe("AmortizacaoAnual");
        });

        test("should create AmortizacaoBienal", () => {
            const amortizacao = Amortizacao.create("Bienal", 24, undefined, 100);
            expect(amortizacao.constructor.name).toBe("AmortizacaoBienal");
        });

        test("should create AmortizacaoCustom", () => {
            const amortizacao = Amortizacao.create("Outro", 12, "1,5-10", 100);
            expect(amortizacao.constructor.name).toBe("AmortizacaoCustom");
        });

        test("should throw error for invalid period", () => {
            expect(() => {
                Amortizacao.create("Invalido" as PeriodoAmortizacao, 12, undefined, 100);
            }).toThrow("Período de amortização inválido: Invalido");
        });
    });

    describe("AmortizacaoMensal", () => {
        test("should apply to any month", () => {
            const amortizacao = Amortizacao.create("Mensal", 12, undefined, 100);
            expect(amortizacao.appliesTo(1)).toBe(true);
            expect(amortizacao.appliesTo(10)).toBe(true);
        });
    });

    describe("AmortizacaoAnual", () => {
        test("should apply only to multiples of 12", () => {
            const amortizacao = Amortizacao.create("Anual", 24, undefined, 100);
            expect(amortizacao.appliesTo(1)).toBe(false);
            expect(amortizacao.appliesTo(12)).toBe(true);
            expect(amortizacao.appliesTo(13)).toBe(false);
            expect(amortizacao.appliesTo(24)).toBe(true);
        });
    });

    describe("AmortizacaoBienal", () => {
        test("should apply only to multiples of 24", () => {
            const amortizacao = Amortizacao.create("Bienal", 48, undefined, 100);
            expect(amortizacao.appliesTo(1)).toBe(false);
            expect(amortizacao.appliesTo(12)).toBe(false);
            expect(amortizacao.appliesTo(24)).toBe(true);
            expect(amortizacao.appliesTo(36)).toBe(false);
            expect(amortizacao.appliesTo(48)).toBe(true);
        });
    });

    describe("AmortizacaoCustom", () => {
        test("should apply to single months", () => {
            const amortizacao = Amortizacao.create("Outro", 12, "1, 5, 10", 100);
            expect(amortizacao.appliesTo(1)).toBe(true);
            expect(amortizacao.appliesTo(5)).toBe(true);
            expect(amortizacao.appliesTo(10)).toBe(true);
            expect(amortizacao.appliesTo(2)).toBe(false);
        });

        test("should apply to ranges", () => {
            const amortizacao = Amortizacao.create("Outro", 20, "1-5, 10-12", 100);
            expect(amortizacao.appliesTo(1)).toBe(true);
            expect(amortizacao.appliesTo(3)).toBe(true);
            expect(amortizacao.appliesTo(5)).toBe(true);
            expect(amortizacao.appliesTo(6)).toBe(false);
            expect(amortizacao.appliesTo(10)).toBe(true);
            expect(amortizacao.appliesTo(11)).toBe(true);
            expect(amortizacao.appliesTo(12)).toBe(true);
            expect(amortizacao.appliesTo(13)).toBe(false);
        });

        test("should not apply if month > prazoMeses", () => {
            const amortizacao = Amortizacao.create("Outro", 5, "6", 100);
            expect(amortizacao.appliesTo(6)).toBe(false);
        });
    });

    describe("validateCustomInterval", () => {
        test("should validate correct input", () => {
            expect(() => Amortizacao.validateCustomInterval("1, 5-10")).not.toThrow();
        });

        test("should throw error if empty", () => {
            expect(() => Amortizacao.validateCustomInterval("")).toThrow("Intervalo personalizado é obrigatório");
            expect(() => Amortizacao.validateCustomInterval("   ")).toThrow("Intervalo personalizado é obrigatório");
            expect(() => Amortizacao.validateCustomInterval(undefined)).toThrow("Intervalo personalizado é obrigatório");
        });

        test("should throw error for invalid ranges", () => {
            expect(() => Amortizacao.validateCustomInterval("5-1")).toThrow('Intervalo inválido: "5-1"');
            expect(() => Amortizacao.validateCustomInterval("a-b")).toThrow(); // Will likely fail with NaN check
        });

        test("should throw error for invalid numbers", () => {
            expect(() => Amortizacao.validateCustomInterval("a")).toThrow();
            expect(() => Amortizacao.validateCustomInterval("0")).toThrow('Mês inválido: "0"');
            expect(() => Amortizacao.validateCustomInterval("-1")).toThrow();
        });
    });

    describe("serialization", () => {
        test("should serialize and deserialize AmortizacaoMensal", () => {
            const original = Amortizacao.create("Mensal", 12, undefined, 100);
            const serialized = JSON.parse(JSON.stringify(original));
            const restored = Amortizacao.fromJSON(serialized);

            expect(restored).toBeInstanceOf(Amortizacao);

			// Since we export the class abstractly, we might check constructor name if classes are not exported
            expect(restored.constructor.name).toBe("AmortizacaoMensal");
            expect(restored.valor).toBe(100);
            expect(restored.appliesTo(1)).toBe(true);
        });

        test("should serialize and deserialize AmortizacaoCustom", () => {
            const original = Amortizacao.create("Outro", 20, "1-5", 200);
            const serialized = JSON.parse(JSON.stringify(original));
            const restored = Amortizacao.fromJSON(serialized);

            expect(restored).toBeInstanceOf(Amortizacao);
            expect(restored.constructor.name).toBe("AmortizacaoCustom");
            expect(restored.valor).toBe(200);
            expect(restored.appliesTo(3)).toBe(true);
            expect(restored.appliesTo(6)).toBe(false);

            // Check specific properties
            expect((restored as any).input).toBe("1-5");
            expect((restored as any).prazoMeses).toBe(20);
        });
    });
});
