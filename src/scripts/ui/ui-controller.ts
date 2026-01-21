import VMasker from "vanilla-masker";

import { Amortizacao } from "../models/amortizacao";
import { AmortizacaoModalResult, FormNumericField } from "../types";
import { Resultado } from "../types/resultado";
import { ValoresSimulacao } from "../types/valores-simulacao";

import { AmortizacaoModalController } from "./amortizacao-modal-controller";
import { AmortizacoesListController } from "./amortizacoes-list-controller";
import { ColorModeController } from "./color-mode-controller";
import { ConfirmationModalController } from "./confirmation-modal-controller";
import { FormController, OnSubmitEventListener } from "./form-controller";
import { GenericModalController } from "./generic-modal-controller";
import { SimulacaoResultController } from "./simulacao-result-controller";
import { TaxasResultController } from "./taxas-result-controller";

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
	private genericModal: GenericModalController;
	private confirmationModal: ConfirmationModalController;
	private amortizacaoModalController: AmortizacaoModalController;
	private amortizacoesListController: AmortizacoesListController;
	private colorModeController: ColorModeController;
	private simulacaoResultController: SimulacaoResultController;
	private taxasResultController: TaxasResultController;

	private onSubmitEventListener?: OnSubmitEventListener = undefined;

	constructor() {
		this.formController = new FormController(this.onSubmitEvent.bind(this));
		this.genericModal = new GenericModalController();
		this.confirmationModal = new ConfirmationModalController();
		this.amortizacoesListController = new AmortizacoesListController(this.confirmationModal);
		this.amortizacaoModalController = new AmortizacaoModalController();
		this.colorModeController = new ColorModeController();
		this.simulacaoResultController = new SimulacaoResultController();
		this.taxasResultController = new TaxasResultController();

		this.setupForm();
		this.setupAmortizacoes();
		this.setupColorMode();
		this.setupMask();
	}

	public submit() {
		this.formController.submit();
	}

	public setupRates(selic: number, tr: number, ano: number) {
		this.taxasResultController.render(selic, tr, ano);
	}

	private onSubmitEvent(valores: ValoresSimulacao) {
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

	public setAmortizacoes(entries: AmortizacaoModalResult[]) {
		this.amortizacoesListController.setEntries(entries);
	}

	public showModal(title: string, message: string, background: string = "bg-primary") {
		this.genericModal.show(title, message, background);
	}

	public showAmortizacaoModal() {
		this.amortizacaoModalController.show();
	}

	public showResultado(resultado: Resultado) {
		this.simulacaoResultController.render(resultado);
	}

	public getValoresSimulacao(): ValoresSimulacao {
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

	private handleAmortizacaoSubmit(result: AmortizacaoModalResult) {
		this.amortizacoesListController.addEntry(result);
	}

	private setupMask() {
		VMasker(document.querySelectorAll(".mask-money")).maskMoney(MASK_CONFIG.money);
		VMasker(document.querySelectorAll(".mask-number")).maskMoney(MASK_CONFIG.number);
		VMasker(document.querySelectorAll(".mask-integer")).maskMoney(MASK_CONFIG.integer);
	}

}