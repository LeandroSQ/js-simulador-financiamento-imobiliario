import * as bootstrap from "bootstrap";

import { Amortizacao, PeriodoAmortizacao } from "../models/amortizacao";
import { AmortizacaoModalSubmitHandler } from "../types";
import { parseNumericField, validateMaskedNumericField } from "../utils/numeric-field";


export class AmortizacaoModalController {

	private readonly modalElement: HTMLElement;
	private readonly modal: bootstrap.Modal;
	private readonly periodoSelect: HTMLSelectElement;
	private readonly valorInput: HTMLInputElement;
	private readonly intervaloInput: HTMLInputElement;
	private readonly intervaloContainer: HTMLElement;
	private readonly submitButton: HTMLButtonElement;
	private submitHandler?: AmortizacaoModalSubmitHandler;

	constructor(id: string = "amortizacao-modal") {
		this.modalElement = document.getElementByIdOrThrow(id);
		this.modal = new bootstrap.Modal(this.modalElement);
		this.periodoSelect = document.getElementByIdOrThrow<HTMLSelectElement>("amortizacao-periodo");
		this.valorInput = document.getElementByIdOrThrow<HTMLInputElement>("amortizacao-valor");
		this.intervaloInput = document.getElementByIdOrThrow<HTMLInputElement>("amortizacao-intervalos");
		this.intervaloContainer = document.getElementByIdOrThrow("amortizacao-intervalo-container");
		this.submitButton = document.getElementByIdOrThrow<HTMLButtonElement>("amortizacao-modal-insert");

		this.updateIntervaloVisibility();
	}

	public setup(submitHandler: AmortizacaoModalSubmitHandler) {
		this.submitHandler = submitHandler;

		this.submitButton.addEventListener("click", () => { this.handleSubmit(); });
		this.valorInput.addEventListener("input", () => { this.validateForm(); });
		this.periodoSelect.addEventListener("change", () => {
			this.updateIntervaloVisibility();
			this.validateForm();
		});
		this.intervaloInput.addEventListener("input", () => { this.validateForm(); });

		this.validateForm();
	}

	public show() {
		this.modal.show();
	}

	public reset() {
		this.periodoSelect.value = "Anual";
		this.valorInput.value = "";
		this.intervaloInput.value = "";
		this.updateIntervaloVisibility();
		this.validateForm();
	}

	private handleSubmit() {
		this.validateForm();

		if (this.submitButton.hasAttribute("disabled")) return;

		const periodo = this.periodoSelect.value as PeriodoAmortizacao;
		const intervalo = periodo === "Outro" ? this.intervaloInput.value : "";
		const valor = parseNumericField(this.valorInput, { required: true });

		if (Number.isNaN(valor)) {
			// Should not happen if button is enabled
			return;
		}

		if (this.submitHandler) {
			this.submitHandler({
				periodo,
				intervalo,
				valor 
			});
		}

		this.reset();
	}

	private validateForm() {
		this.updateIntervaloVisibility();
		validateMaskedNumericField(this.valorInput);

		const requiresIntervalo = this.periodoSelect.value === "Outro";
		if (requiresIntervalo) {
			try {
				Amortizacao.validateCustomInterval(this.intervaloInput.value);
				this.intervaloInput.setCustomValidity("");
			} catch (e: unknown) {
				const message = e instanceof Error ? e.message : "Intervalo inválido";
				this.intervaloInput.setCustomValidity(message);
			}
		} else {
			this.intervaloInput.value = "";
			this.intervaloInput.setCustomValidity("");
		}

		this.valorInput.reportValidity();
		this.periodoSelect.reportValidity();

		if (requiresIntervalo) {
			this.intervaloInput.reportValidity();
		}

		const valorValido = this.valorInput.checkValidity();
		const periodoValido = this.periodoSelect.checkValidity();
		const intervaloValido = !requiresIntervalo || this.intervaloInput.checkValidity();

		if (valorValido && periodoValido && intervaloValido) {
			this.submitButton.removeAttribute("disabled");
		} else {
			this.submitButton.setAttribute("disabled", "disabled");
		}
	}

	private updateIntervaloVisibility() {
		const shouldShow = this.periodoSelect.value === "Outro";
		this.intervaloInput.toggleAttribute("required", shouldShow);

		if (shouldShow) {
			this.intervaloContainer.classList.remove("d-none");
			return;
		}

		this.intervaloContainer.classList.add("d-none");
		this.intervaloInput.value = "";
		this.intervaloInput.setCustomValidity("");
	}

}
