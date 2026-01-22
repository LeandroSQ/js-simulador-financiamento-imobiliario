import VMasker from "vanilla-masker";

import { Amortizacao } from "../models/amortizacao";
import {
	ExtraAmortizationInput,
	FormNumericField,
	SimulationInput,
	SimulationResult
} from "../types";

import { AmortizacaoModalController } from "./amortizacao-modal-controller";
import { AmortizacoesListController } from "./amortizacoes-list-controller";
import { ColorModeController } from "./color-mode-controller";
import { ConfirmationModalController } from "./confirmation-modal-controller";
import { FormController, OnSubmitEventListener } from "./form-controller";
import { AlertModalController } from "./generic-modal-controller";
import { SimulacaoResultController } from "./simulacao-result-controller";
import { RatesDisplayController } from "./taxas-result-controller";

const MASK_CONFIG = {
	money: {
		precision: 2,
		separator: ",",
		delimiter: ".",
		zeroCents: false
	},
	number: {
		precision: 2,
		separator: ",",
		delimiter: ".",
		zeroCents: false
	},
	integer: {
		precision: 0,
		separator: ",",
		delimiter: ".",
		zeroCents: false
	}
} as const;

export class UIController {

	public readonly amortizacoes: Amortizacao[] = [];

	private formController: FormController;
	private alertModal: AlertModalController;
	private confirmationModal: ConfirmationModalController;
	private amortizacaoModalController: AmortizacaoModalController;
	private amortizacoesListController: AmortizacoesListController;
	private colorModeController: ColorModeController;
	private simulacaoResultController: SimulacaoResultController;
	private ratesDisplayController: RatesDisplayController;

	private onSubmitEventListener?: OnSubmitEventListener = undefined;

	constructor() {
		this.formController = new FormController(this.onSubmitEvent.bind(this));
		this.alertModal = new AlertModalController();
		this.confirmationModal = new ConfirmationModalController();
		this.amortizacoesListController = new AmortizacoesListController(this.confirmationModal);
		this.amortizacaoModalController = new AmortizacaoModalController();
		this.colorModeController = new ColorModeController();
		this.simulacaoResultController = new SimulacaoResultController();
		this.ratesDisplayController = new RatesDisplayController();

		this.setupForm();
		this.setupAmortizacoes();
		this.setupColorMode();
		this.setupMask();
	}

	public submit() {
		this.formController.submit();
	}

	public setupRates(selic: number, tr: number, ano: number) {
		this.ratesDisplayController.render(selic, tr, ano);
	}

	private onSubmitEvent(valores: SimulationInput) {
		this.amortizacoes.length = 0;
		const parsed = this.amortizacoesListController.getEntries().map(entry =>
			Amortizacao.create(entry.periodo, valores.prazoMeses, entry.intervalo, entry.valor)
		);
		this.amortizacoes.push(...parsed);
		this.onSubmitEventListener?.call(this, valores);
	}

	public addEventListenerOnSubmit(listener: OnSubmitEventListener) {
		this.onSubmitEventListener = listener;
	}

	public setField(field: FormNumericField, value: number) {
		this.formController.setField(field, value);
	}

	public setAmortizacoes(entries: ExtraAmortizationInput[]) {
		this.amortizacoesListController.setEntries(entries);
	}

	public showModal(title: string, message: string, background: string = "bg-primary") {
		this.alertModal.show(title, message, background);
	}

	public showAmortizacaoModal() {
		this.amortizacaoModalController.show();
	}

	public showResultado(resultado: SimulationResult) {
		this.simulacaoResultController.render(resultado);
	}

	public getValoresSimulacao(): SimulationInput {
		return this.formController.getValoresSimulacao();
	}

	private setupForm() {
		this.formController.setup();
	}

	private setupAmortizacoes() {
		this.amortizacoesListController.onChange(() => this.formController.submitIfValid());
		this.amortizacaoModalController.setup(result => { this.handleAmortizacaoSubmit(result); });
	}

	private setupColorMode() {
		this.colorModeController.onChange(() => {
			this.simulacaoResultController.onColorModeChange();
		});
		this.colorModeController.setup();
	}

	private handleAmortizacaoSubmit(result: ExtraAmortizationInput) {
		this.amortizacoesListController.addEntry(result);
	}

	private setupMask() {
		VMasker(document.querySelectorAll(".mask-money")).maskMoney(MASK_CONFIG.money);
		VMasker(document.querySelectorAll(".mask-number")).maskMoney(MASK_CONFIG.number);
		VMasker(document.querySelectorAll(".mask-integer")).maskMoney(MASK_CONFIG.integer);
	}

}