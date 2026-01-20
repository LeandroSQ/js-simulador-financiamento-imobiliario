import { AmortizacaoEntry, AmortizacaoModalResult } from "../types";

import { ConfirmationModalController } from "./confirmation-modal-controller";

export class AmortizacoesListController {

	private readonly container: HTMLElement;
	private readonly template: HTMLTemplateElement;
	private readonly emptyState: HTMLElement;
	private readonly entries: AmortizacaoEntry[] = [];
	private changeHandler?: (entries: AmortizacaoModalResult[]) => void;

	private notifyChange: VoidFunction;

	constructor(private readonly confirmationModal: ConfirmationModalController) {
		this.container = document.getElementByIdOrThrow("amortizacoes-list");
		this.template = document.getElementByIdOrThrow<HTMLTemplateElement>("amortizacoes-list-item");
		this.emptyState = document.getElementByIdOrThrow("amortizacoes-list-empty");

		this.notifyChange = Function.debounce(() => {
			if (this.changeHandler) {
				this.changeHandler(this.getEntries());
			}
		}, 100);
	}

	public onChange(handler: (entries: AmortizacaoModalResult[]) => void) {
		this.changeHandler = handler;
	}

	public addEntry(data: AmortizacaoModalResult) {
		const fragment = this.template.content.cloneNode(true) as DocumentFragment;
		const element = fragment.firstElementChild as HTMLElement | null;
		if (!element) {
			throw new Error("Amortizações template should contain an element");
		}

		const periodoElement = element.querySelector(".amortizacao-periodo");
		const valorElement = element.querySelector(".amortizacao-valor");
		const deleteButton = element.querySelector(".amortizacao-delete-button");

		if (!periodoElement || !valorElement || !deleteButton) {
			throw new Error("Amortizações template missing required elements");
		}

		periodoElement.textContent = data.periodo === "Outro" ? (data.intervalo ?? "") : data.periodo;
		valorElement.textContent = data.valor.toLocaleString("pt-BR", {
			style: "currency",
			currency: "BRL" 
		});

		deleteButton.addEventListener("click", event => {
			// eslint-disable-next-line @typescript-eslint/no-floating-promises
			(async () => {
				event.preventDefault();
				const index = this.entries.findIndex(entry => entry.element === element);
				if (index < 0) return;

				const descricao = data.periodo === "Outro" ? data.intervalo : data.periodo;
				const confirmed = await this.confirmationModal.confirm({
					title: "Remover amortização",
					message: `Deseja remover a amortização '${descricao} ${data.valor.toCurrencyString()}'?`,
					confirmLabel: "Remover",
					cancelLabel: "Cancelar",
					background: "bg-danger"
				});

				if (!confirmed) return;

				this.removeEntry(index);
			})();
		});

		this.container.appendChild(fragment);
		this.entries.push({
			data,
			element 
		});
		console.log(this.entries, this.changeHandler);
		this.emptyState.style.display = "none";
		this.notifyChange();
	}

	public removeEntry(index: number) {
		if (index < 0 || index >= this.entries.length) return;
		const entry = this.entries[index];

		this.container.removeChild(entry.element);
		this.entries.splice(index, 1);

		if (this.entries.length === 0) {
			this.emptyState.style.display = "block";
		}

		this.notifyChange();
	}

	public setEntries(entries: AmortizacaoModalResult[]) {
		// Clear existing entries
		while (this.entries.length > 0) {
			this.removeEntry(0);
		}

		// Add new entries
		for (const entry of entries) {
			this.addEntry(entry);
		}
	}

	public getEntries(): AmortizacaoModalResult[] {
		return this.entries.map(entry => entry.data);
	}

}
