import { Resultado } from "../types/Resultado";

export class SimulacaoResultController {
	private readonly container: HTMLElement;
	private readonly template: HTMLTemplateElement;
	private readonly tableBody: HTMLTableSectionElement;

	private readonly custoTotalEfetivoElement: HTMLElement;
	private readonly valorFinanciadoElement: HTMLElement;
	private readonly valorTotalAmortizadoElement: HTMLElement;
	private readonly valorTotalJurosElement: HTMLElement;
	private readonly parcelaInicialElement: HTMLElement;
	private readonly parcelaFinalElement: HTMLElement;
	private readonly quantidadeParcelasElement: HTMLElement;

	constructor() {
		this.container = document.getElementByIdOrThrow<HTMLElement>("simulacao-results");
		this.template = this.container.querySelector<HTMLTemplateElement>("#simulacao-parcela-template") ?? (() => { throw new Error("Template de parcela não encontrado"); })();
		this.tableBody = this.container.querySelector<HTMLTableSectionElement>("#simulacao-results-table tbody") ?? (() => { throw new Error("Tabela de resultados não encontrada"); })();

		this.custoTotalEfetivoElement = this.getField("custo-total-efetivo");
		this.valorFinanciadoElement = this.getField("valor-financiado");
		this.valorTotalAmortizadoElement = this.getField("valor-total-amortizado");
		this.valorTotalJurosElement = this.getField("valor-total-juros");
		this.parcelaInicialElement = this.getField("parcela-inicial");
		this.parcelaFinalElement = this.getField("parcela-final");
		this.quantidadeParcelasElement = this.getField("quantidade-parcelas");
	}

	public render(resultado: Resultado) {
		const quantidadeParcelas = resultado.evolucao.length;

		this.custoTotalEfetivoElement.textContent = resultado.custoTotalEfetivo.toCurrencyString();
		this.valorFinanciadoElement.textContent = resultado.valorFinanciado.toCurrencyString();
		this.valorTotalAmortizadoElement.textContent = resultado.valorTotalAmortizado.toCurrencyString();
		this.valorTotalJurosElement.textContent = resultado.valorTotalJuros.toCurrencyString();
		this.parcelaInicialElement.textContent = resultado.valorParcelaInicial.toCurrencyString();
		this.parcelaFinalElement.textContent = resultado.valorParcelaFinal.toCurrencyString();
		this.quantidadeParcelasElement.textContent = `${quantidadeParcelas} (${(quantidadeParcelas / 12).toFixed(2)} anos)`;

		this.renderTabela(resultado.evolucao);
		this.container.classList.add("active");
	}

	private renderTabela(evolucao: Resultado["evolucao"]) {
		const existingRows = this.tableBody.querySelectorAll("tr");
		existingRows.forEach(row => row.remove());

		const fragment = document.createDocumentFragment();

		evolucao.forEach((mes, index) => {
			const clone = this.template.content.cloneNode(true) as DocumentFragment;
			const row = clone.querySelector("tr");
			if (!row) {
				throw new Error("Template de parcela deve conter uma linha");
			}

			this.setText(row, ".numero-parcela", (index + 1).toLocaleString("pt-BR"));
			this.setText(row, ".prestacao", mes.valorParcela.toCurrencyString());
			this.setText(row, ".saldo-devedor", mes.saldoDevedor.toCurrencyString());
			this.setText(row, ".total-encargos", mes.valorEncargo.toCurrencyString());

			fragment.appendChild(clone);
		});

		this.tableBody.appendChild(fragment);
	}

	private getField(field: string): HTMLElement {
		const element = this.container.querySelector<HTMLElement>(`[data-simulacao-field='${field}']`);
		if (!element) {
			throw new Error(`Elemento de resultado '${field}' não encontrado`);
		}
		return element;
	}

	private setText(context: ParentNode, selector: string, value: string) {
		const element = context.querySelector<HTMLElement>(selector);
		if (!element) {
			throw new Error(`Elemento '${selector}' não encontrado no template`);
		}
		element.textContent = value;
	}
}
