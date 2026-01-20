import { Amortizacao } from "../src/scripts/models/amortizacao";
import { SimuladorFinanciamento } from "../src/scripts/core/simulador-financiamento";
import { Correcao } from "../src/scripts/types/correcao";
import { Resultado } from "../src/scripts/types/resultado";
import { Tabela } from "../src/scripts/types/tabela";
import { ValoresSimulacao } from "../src/scripts/types/valores-simulacao";

function assert(input: ValoresSimulacao, amortizacao: Amortizacao[] = [], expected: Partial<Resultado>) {
	const simulador = new SimuladorFinanciamento(input, amortizacao);
	const result = simulador.calculate();
	// Check properties provided in expected
	for (const key in expected) {
		const k = key as keyof Resultado;
		expect(result[k]).toEqual(expected[k]);
	}
}

describe("Simulador", () => {
	test("Simulação simples, pré-fixada, sem entrada, sem amortização, juros 0%, tabela SAC, prazo 1 mês", () => {
		assert(
			{
				correcao: Correcao.PRE_FIXADO,
				valorImovel: 100_000,
				projecaoTaxaJuros: 0,
				tabela: Tabela.SAC,
				taxaJurosAnual: 0,
				valorEntrada: 0,
				prazoMeses: 1,
				taxaAdministracaoMensal: 0,
				seguroMensal: 0,
			},
			[],
			{
				valorParcelaInicial: 100_000,
				custoTotalEfetivo: 100_000,
				valorParcelaFinal: 100_000,
				valorFinanciado: 100_000,
				valorTotalAmortizado: 100_000,
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
				correcao: Correcao.PRE_FIXADO,
				valorImovel: 100_000,
				projecaoTaxaJuros: 0,
				tabela: Tabela.SAC,
				taxaJurosAnual: 0,
				valorEntrada: 0,
				prazoMeses: 2,
				taxaAdministracaoMensal: 0,
				seguroMensal: 0,
			},
			[],
			{
				valorParcelaInicial: 50_000,
				custoTotalEfetivo: 100_000,
				valorParcelaFinal: 50_000,
				valorFinanciado: 100_000,
				valorTotalAmortizado: 100_000,
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
				correcao: Correcao.PRE_FIXADO,
				valorImovel: 100_000,
				projecaoTaxaJuros: 0,
				tabela: Tabela.SAC,
				taxaJurosAnual: 12,
				valorEntrada: 0,
				prazoMeses: 300,
				taxaAdministracaoMensal: 0,
				seguroMensal: 0,
			},
			[]
		);

		const result = simulador.calculate();

		expect(result.valorFinanciado).toBe(100_000);
		expect(result.valorTotalAmortizado).toBeCloseTo(100_000, 0);
		expect(result.evolucao).toHaveLength(300);
		expect(result.evolucao[0].valorAmortizacao).toBeCloseTo(333.33, 1);
		expect(result.evolucao[299].valorAmortizacao).toBeCloseTo(333.33, 1);
		expect(result.evolucao[299].saldoDevedor).toBeCloseTo(0, 0);
	});

	test("350 mil, entrada 180 mil, 11.49% a.a, seguro 43, taxa adm 25, 420 parcelas", () => {
		const simulador = new SimuladorFinanciamento({
			correcao: Correcao.PRE_FIXADO,
			valorImovel: 350_000,
			projecaoTaxaJuros: 0,
			tabela: Tabela.SAC,
			taxaJurosAnual: 11.29,
			valorEntrada: 180_000,
			prazoMeses: 420,
			taxaAdministracaoMensal: 25,
			seguroMensal: 43,
		});

		const result = simulador.calculate();
		expect(result.valorParcelaInicial).toBeCloseTo(1_926.93, 2);
	});

	test("350 mil, entrada 180 mil, 11.49% a.a, seguro 43, taxa adm 25, 420 parcelas, mil amortização", () => {
		const simulador = new SimuladorFinanciamento({
			correcao: Correcao.PRE_FIXADO,
			valorImovel: 350_000,
			projecaoTaxaJuros: 0,
			tabela: Tabela.SAC,
			taxaJurosAnual: 11.29,
			valorEntrada: 180_000,
			prazoMeses: 420,
			taxaAdministracaoMensal: 25,
			seguroMensal: 43,
		}, [
			Amortizacao.create("Mensal", 420, undefined, 1000)
		]);

		const result = simulador.calculate();
		expect(result.valorParcelaInicial).toBeCloseTo(2_926.93, 2);
		expect(result.evolucao.length).toBeLessThan(420);
	});
});