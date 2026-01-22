import { SimuladorFinanciamento } from "../src/scripts/core/simulador-financiamento";
import { Amortizacao } from "../src/scripts/models/amortizacao";
import {
	Correcao,
	Resultado,
	Tabela,
	ValoresSimulacao
} from "../src/scripts/types";

function assert(input: ValoresSimulacao, amortizacao: Amortizacao[] = [], expected: Partial<Resultado>) {
	const simulador = new SimuladorFinanciamento(input, amortizacao);
	const result = simulador.calculate();
	// Check properties provided in expected
	for (const key in expected) {
		const k = key as keyof Resultado;
		expect(result[k]).toEqual(expected[k]);
	}
}

const baseInput: ValoresSimulacao = {
	correcao: Correcao.PRE_FIXADO,
	valorImovel: 100_000,
	projecaoTaxaJuros: 0,
	tabela: Tabela.SAC,
	taxaJurosAnual: 0,
	valorEntrada: 0,
	prazoMeses: 12,
	taxaAdministracaoMensal: 0,
	seguroMensal: 0
};

describe("Simulador", () => {
	describe("SAC calculations - happy path", () => {
		test("Simulação simples, pré-fixada, sem entrada, sem amortização, juros 0%, tabela SAC, prazo 1 mês", () => {
			assert(
				{
					...baseInput,
					prazoMeses: 1
				},
				[],
				{
					valorParcelaInicial: 100_000,
					custoTotalEfetivo: 100_000,
					valorParcelaFinal: 100_000,
					valorFinanciado: 100_000,
					valorTotalAmortizado: 0,
					valorTotalJuros: 0,
					seguroMensal: 0,
					taxaAdministracaoMensal: 0,
					evolucao: [
						{
							saldoDevedor: 0,
							valorParcela: 100_000,
							valorAmortizacao: 100_000,
							valorJuros: 0,
							valorEncargo: 100_000,
						},
					],
				}
			);
		});

		test("Simulação simples, pré-fixada, sem entrada, sem amortização, juros 0%, tabela SAC, prazo 2 meses", () => {
			assert(
				{
					...baseInput,
					prazoMeses: 2
				},
				[],
				{
					valorParcelaInicial: 50_000,
					custoTotalEfetivo: 100_000,
					valorParcelaFinal: 50_000,
					valorFinanciado: 100_000,
					valorTotalAmortizado: 0,
					valorTotalJuros: 0,
					seguroMensal: 0,
					taxaAdministracaoMensal: 0,
					evolucao: [
						{
							saldoDevedor: 50_000,
							valorParcela: 50_000,
							valorAmortizacao: 50_000,
							valorJuros: 0,
							valorEncargo: 50_000,
						},
						{
							saldoDevedor: 0,
							valorParcela: 50_000,
							valorAmortizacao: 50_000,
							valorJuros: 0,
							valorEncargo: 50_000,
						},
					],
				}
			);
		});

		test("Simulação simples, pré-fixada, sem entrada, sem amortização, juros 10%, tabela SAC, prazo 300 meses", () => {
			const simulador = new SimuladorFinanciamento(
				{
					...baseInput,
					taxaJurosAnual: 12,
					prazoMeses: 300
				},
				[]
			);

			const result = simulador.calculate();

			expect(result.valorFinanciado).toBe(100_000);
			expect(result.valorTotalAmortizado).toBeCloseTo(0, 0);
			expect(result.evolucao).toHaveLength(300);
			expect(result.evolucao[0].valorAmortizacao).toBeCloseTo(333.33, 1);
			expect(result.evolucao[299].valorAmortizacao).toBeCloseTo(333.33, 1);
			expect(result.evolucao[299].saldoDevedor).toBeCloseTo(0, 0);
		});

		test("350 mil, entrada 180 mil, 11.49% a.a, seguro 43, taxa adm 25, 420 parcelas", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 350_000,
				taxaJurosAnual: 11.29,
				valorEntrada: 180_000,
				prazoMeses: 420,
				taxaAdministracaoMensal: 25,
				seguroMensal: 43,
			});

			const result = simulador.calculate();
			expect(result.valorParcelaInicial).toBeCloseTo(1_994.93, 2);
		});

		test("350 mil, entrada 180 mil, 11.49% a.a, seguro 43, taxa adm 25, 420 parcelas, mil amortização", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 350_000,
				taxaJurosAnual: 11.29,
				valorEntrada: 180_000,
				prazoMeses: 420,
				taxaAdministracaoMensal: 25,
				seguroMensal: 43,
			}, [Amortizacao.create("Mensal", 420, undefined, 1000)]);

			const result = simulador.calculate();
			expect(result.valorParcelaInicial).toBeCloseTo(2_994.93, 2);
			expect(result.evolucao.length).toBeLessThan(420);
		});
	});

	describe("Error handling and edge cases", () => {
		test("should throw error for PRICE table (not implemented)", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				tabela: Tabela.PRICE
			});

			expect(() => simulador.calculate()).toThrow("Tabela de amortização não implementada");
		});

		test("should throw error for invalid table type", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				tabela: "INVALID" as Tabela
			});

			expect(() => simulador.calculate()).toThrow("Tabela de amortização inválida");
		});

		test("should throw error for zero prazo", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				prazoMeses: 0
			});

			expect(() => simulador.calculate()).toThrow("Prazo inválido");
		});

		test("should throw error for negative prazo", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				prazoMeses: -1
			});

			expect(() => simulador.calculate()).toThrow("Prazo inválido");
		});

		test("should handle entrada equal to valor imovel (100% down payment)", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 100_000,
				valorEntrada: 100_000,
				prazoMeses: 12
			});

			// 100% down payment means saldo devedor = 0, so no parcelas are generated
			// The simulator throws an error for this edge case, which is correct behavior
			expect(() => simulador.calculate()).toThrow("Nenhuma parcela gerada");
		});

		test("should handle very small financing amounts", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 100,
				valorEntrada: 99,
				prazoMeses: 1
			});

			const result = simulador.calculate();
			expect(result.valorFinanciado).toBe(1);
			expect(result.valorParcelaInicial).toBe(1);
		});
	});

	describe("Extra amortization edge cases", () => {
		test("should handle multiple amortization types together", () => {
			const simulador = new SimuladorFinanciamento(
				{
					...baseInput,
					valorImovel: 100_000,
					prazoMeses: 24,
					taxaJurosAnual: 12
				},
				[
					Amortizacao.create("Mensal", 24, undefined, 500),
					Amortizacao.create("Anual", 24, undefined, 5000)
				]
			);

			const result = simulador.calculate();
			// Month 12 should have both monthly and annual amortization
			expect(result.valorTotalAmortizado).toBeGreaterThan(0);
			expect(result.evolucao.length).toBeLessThan(24);
		});

		test("should cap extra amortization at remaining balance", () => {
			const simulador = new SimuladorFinanciamento(
				{
					...baseInput,
					valorImovel: 10_000,
					prazoMeses: 12,
					taxaJurosAnual: 0
				},
				[Amortizacao.create("Mensal", 12, undefined, 50_000)] // More than total loan
			);

			const result = simulador.calculate();
			// Loan should be paid off quickly
			expect(result.evolucao.length).toBe(1);
			expect(result.evolucao[0].saldoDevedor).toBe(0);
		});

		test("should handle custom amortization intervals", () => {
			const simulador = new SimuladorFinanciamento(
				{
					...baseInput,
					valorImovel: 100_000,
					prazoMeses: 12,
					taxaJurosAnual: 12
				},
				[Amortizacao.create("Outro", 12, "3, 6, 9", 5000)]
			);

			const result = simulador.calculate();
			expect(result.valorTotalAmortizado).toBeGreaterThan(0);
		});
	});

	describe("Interest calculation accuracy", () => {
		test("should correctly compound interest monthly", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 100_000,
				taxaJurosAnual: 12, // 12% annual
				prazoMeses: 12
			});

			const result = simulador.calculate();

			// Monthly rate = (1 + 0.12)^(1/12) - 1 ≈ 0.00948879
			const expectedMonthlyRate = Math.pow(1.12, 1 / 12) - 1;
			const firstMonthInterest = 100_000 * expectedMonthlyRate;

			expect(result.evolucao[0].valorJuros).toBeCloseTo(firstMonthInterest, 2);
		});

		test("should accumulate total interest correctly", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 100_000,
				taxaJurosAnual: 12,
				prazoMeses: 12
			});

			const result = simulador.calculate();

			// Sum all interest from evolucao
			const summedInterest = result.evolucao.reduce((sum, m) => sum + m.valorJuros, 0);
			expect(result.valorTotalJuros).toBeCloseTo(summedInterest, 2);
		});
	});

	describe("Fees and charges", () => {
		test("should include seguro in valorEncargo but not valorParcela", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 100_000,
				prazoMeses: 12,
				taxaJurosAnual: 0,
				seguroMensal: 50,
				taxaAdministracaoMensal: 0
			});

			const result = simulador.calculate();
			const firstMonth = result.evolucao[0];

			// valorParcela should NOT include seguro (only principal + interest)
			expect(firstMonth.valorParcela).toBeCloseTo(100_000 / 12, 2);
			// valorEncargo should include seguro
			expect(firstMonth.valorEncargo).toBeCloseTo(100_000 / 12 + 50, 2);
		});

		test("should include taxa administracao in valorEncargo", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 100_000,
				prazoMeses: 12,
				taxaJurosAnual: 0,
				seguroMensal: 0,
				taxaAdministracaoMensal: 25
			});

			const result = simulador.calculate();
			const firstMonth = result.evolucao[0];

			expect(firstMonth.valorEncargo).toBeCloseTo(100_000 / 12 + 25, 2);
		});

		test("should accumulate total fees in custoTotalEfetivo", () => {
			const simulador = new SimuladorFinanciamento({
				...baseInput,
				valorImovel: 100_000,
				prazoMeses: 12,
				taxaJurosAnual: 0,
				seguroMensal: 50,
				taxaAdministracaoMensal: 25
			});

			const result = simulador.calculate();

			// CET should include principal + interest + all fees
			const totalFees = (50 + 25) * 12;
			expect(result.custoTotalEfetivo).toBeCloseTo(100_000 + totalFees, 2);
		});
	});
});