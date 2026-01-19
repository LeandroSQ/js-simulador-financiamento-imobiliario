import { Amortizacao } from "../src/scripts/amortizacao";
import { SimuladorFinanciamento } from "../src/scripts/simulador";
import { Correcao } from "../src/scripts/types/correcao";
import { Resultado } from "../src/scripts/types/Resultado";
import { Tabela } from "../src/scripts/types/tabela";
import { ValoresSimulacao } from "../src/scripts/types/valores-simulacao";

function assert(input: ValoresSimulacao, amortizacao: Amortizacao[] = [], expected: Resultado) {
	const simulador = new SimuladorFinanciamento(input, amortizacao);
	const result = simulador.calculate();
	expect(result).toEqual(expected);
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
				valorTotalAmortizado: 0,
				valorTotalJuros: 0,
				seguroMensal: 0,
				taxaAdministracaoMensal: 0,
				evolucao: [
					{
						saldoDevedor: 100_000,
						valorParcela: 100_000,
						valorAmortizacao: 0,
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
				valorTotalAmortizado: 0,
				valorTotalJuros: 0,
				seguroMensal: 0,
				taxaAdministracaoMensal: 0,
				evolucao: [
					{
						saldoDevedor: 100_000,
						valorParcela: 50_000,
						valorAmortizacao: 0,
						valorJuros: 0,
						valorEncargo: 50_000,
					},
					{
						saldoDevedor: 50_000,
						valorParcela: 50_000,
						valorAmortizacao: 0,
						valorJuros: 0,
						valorEncargo: 50_000,
					},
				],
			}
		);
	});

	test("Simulação simples, pré-fixada, sem entrada, sem amortização, juros 10%, tabela SAC, prazo 300 meses", () => {
		assert(
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
			[],
			{
				valorParcelaInicial: 1_000,
				custoTotalEfetivo: 250_500,
				valorParcelaFinal: 1_000,
				valorFinanciado: 100_000,
				valorTotalAmortizado: 0,
				valorTotalJuros: 150_500,
				seguroMensal: 0,
				taxaAdministracaoMensal: 0,
				evolucao: [],
			}
		);
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
			{
				meses: Array.from({ length: 420 }, (_, i) => i + 1),
				valor: 1000
			}
		]);

		const result = simulador.calculate();
		expect(result.valorParcelaInicial).toBeCloseTo(2_926.93, 2);
		expect(result.evolucao.length).toBeLessThan(420);
	});
});