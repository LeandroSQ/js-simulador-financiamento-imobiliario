/**
 * Given the following:
 * - Valor do imóvel
 * - Entrada
 * - Taxa de juros (anual) - Ex: 0.1 = 10%
 * - Valor de amortização mensal
 * - SELIC atual (anual)
 * - Prazo (meses)
 * - Tipo de financiamento (SAC ou PRICE)
 * - Tipo de indexador (SELIC, IPCA, CDI, etc)
 * - Tipo de correção (pré-fixado, pós-fixado, híbrido)
 * - Projeção da taxa de juros (anual)
 *
 * Calculate:
 * - Valor da parcela
 * - Custo efetivo total (CET)
 * - Valor total pago
 * - Valor total de juros
 * - Valor total de amortização
 *
 */
import { Amortizacao } from "./amortizacao";
import { Correcao } from "./types/correcao";
import { HistoricoMes } from "./types/historico-mes";
import { Resultado } from "./types/Resultado";
import { Tabela } from "./types/tabela";
import { ValoresSimulacao } from "./types/valores-simulacao";

export class SimuladorFinanciamento {

	private valorImovel: number;
	private valorEntrada: number;
	private taxaJurosAnual: number;
	private prazoMeses: number;
	private tabela: Tabela;
	private correcao: Correcao;
	private projecaoTaxaJuros: number;
	private seguroMensal: number;
	private taxaAdministracaoMensal: number;
	private amortizacoesExtraordinarias: Amortizacao[];

	constructor(valores: ValoresSimulacao, amortizacoesExtraordinarias: Amortizacao[] = []) {
		this.valorImovel = valores.valorImovel;
		this.valorEntrada = valores.valorEntrada;
		this.taxaJurosAnual = valores.taxaJurosAnual;
		this.prazoMeses = valores.prazoMeses;
		this.tabela = valores.tabela;
		this.correcao = valores.correcao;
		this.projecaoTaxaJuros = valores.projecaoTaxaJuros;
		this.seguroMensal = valores.seguroMensal;
		this.taxaAdministracaoMensal = valores.taxaAdministracaoMensal;
		this.amortizacoesExtraordinarias = amortizacoesExtraordinarias;
	}

	public calculate(): Resultado {
		switch (this.tabela) {
			case Tabela.SAC:
				return this.calcularSAC();

			case Tabela.PRICE:
				throw new Error("Tabela de amortização não implementada");

			default:
				throw new Error("Tabela de amortização inválida");
		}
	}

	private calcularSAC(): Resultado {
		if (this.prazoMeses <= 0) {
			throw new Error("Prazo inválido");
		}

		const saldoDevedorInicial = this.valorImovel - this.valorEntrada;
		let saldoDevedor = saldoDevedorInicial;
		const amortizacaoFixa = saldoDevedorInicial / this.prazoMeses;
		let totalJuros = 0;
		let totalAmortizado = 0;
		let totalTaxas = 0;
		const historico: HistoricoMes[] = [];

		const taxaJurosMensal = Math.pow(1 + this.taxaJurosAnual / 100, 1 / 12) - 1;

		for (let mes = 1; mes <= this.prazoMeses && saldoDevedor > 0; mes++) {
			// Calcula os juros sobre o saldo atual
			const jurosMensais = saldoDevedor * taxaJurosMensal;
			totalJuros += jurosMensais;

			// Define a amortização do mês (até o saldo devedor)
			const amortizacaoExtraordinariaMes = this.amortizacoesExtraordinarias
				.filter(a => a.appliesTo(mes))
				.reduce((sum, a) => sum + a.valor, 0);
			const amortizacaoMes = Math.min(amortizacaoFixa + amortizacaoExtraordinariaMes, saldoDevedor);
			totalAmortizado += amortizacaoMes;

			// Calcula as taxas mensais
			const taxasMensais = this.seguroMensal + this.taxaAdministracaoMensal;
			totalTaxas += taxasMensais;

			// Prestação total do mês
			const prestacaoMes = amortizacaoMes + jurosMensais;

			// Atualiza o saldo devedor
			saldoDevedor = Math.max(0, saldoDevedor - amortizacaoMes);
			if (saldoDevedor <= 0 && mes < this.prazoMeses) {
				console.log(`Financiamento quitado no mês ${mes}`);
			}

			// Armazena o histórico do mês
			historico.push({
				valorParcela: prestacaoMes,
				valorJuros: jurosMensais,
				valorAmortizacao: amortizacaoMes,
				saldoDevedor: saldoDevedor,
				valorEncargo: prestacaoMes + taxasMensais
			});
		}

		if (historico.length === 0) {
			throw new Error("Nenhuma parcela gerada");
		}

		return {
			valorFinanciado: saldoDevedorInicial,
			valorParcelaInicial: historico[0].valorParcela,
			valorParcelaFinal: historico[historico.length - 1].valorParcela,
			evolucao: historico,
			custoTotalEfetivo: saldoDevedorInicial + totalJuros + totalTaxas,
			valorTotalJuros: totalJuros,
			valorTotalAmortizado: totalAmortizado,
			seguroMensal: this.seguroMensal,
			taxaAdministracaoMensal: this.taxaAdministracaoMensal
		};
	}

}