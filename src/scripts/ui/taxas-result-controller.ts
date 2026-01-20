export class TaxasResultController {

	private readonly container: HTMLDivElement;
	private readonly selicElement: HTMLDivElement;
	private readonly trElement: HTMLDivElement;
	private readonly anoElement: HTMLDivElement;

	constructor() {
		this.container = document.getElementByIdOrThrow<HTMLDivElement>("taxas-results");
		this.selicElement = document.getElementByIdOrThrow<HTMLDivElement>("taxa-selic");
		this.trElement = document.getElementByIdOrThrow<HTMLDivElement>("taxa-referencial");
		this.anoElement = document.getElementByIdOrThrow<HTMLDivElement>("ano-calendario");
	}

	public render(selic: number, tr: number, ano: number) {
		this.selicElement.textContent = `${selic.toFixed(2)}% ao ano`;
		this.trElement.textContent = `${tr.toFixed(2)}% ao ano`;
		this.anoElement.textContent = ano.toString();

		this.container.classList.add("active");
	}

}