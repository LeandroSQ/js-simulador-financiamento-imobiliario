/**
 * Controller for displaying current interest rates (SELIC and TR).
 * Shows reference rates fetched from the Brazilian Central Bank.
 */
export class RatesDisplayController {

	private readonly container: HTMLDivElement;
	private readonly selicElement: HTMLDivElement;
	private readonly trElement: HTMLDivElement;
	private readonly yearElement: HTMLDivElement;

	constructor() {
		this.container = document.getElementByIdOrThrow<HTMLDivElement>("taxas-results");
		this.selicElement = document.getElementByIdOrThrow<HTMLDivElement>("taxa-selic");
		this.trElement = document.getElementByIdOrThrow<HTMLDivElement>("taxa-referencial");
		this.yearElement = document.getElementByIdOrThrow<HTMLDivElement>("ano-calendario");
	}

	/**
	 * Renders the current interest rates on the page.
	 * @param selicRate - Current SELIC rate (percentage)
	 * @param trRate - Current TR rate (percentage)
	 * @param referenceYear - Year the rates apply to
	 */
	public render(selicRate: number, trRate: number, referenceYear: number): void {
		this.selicElement.textContent = `${selicRate.toFixed(2)}% ao ano`;
		this.trElement.textContent = `${trRate.toFixed(2)}% ao ano`;
		this.yearElement.textContent = referenceYear.toString();

		this.container.classList.add("active");
	}

}

// Alias for backward compatibility
export { RatesDisplayController as TaxasResultController };