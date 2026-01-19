import VMasker from "vanilla-masker";
import { Amortizacao } from "./amortizacao";
import { Resultado } from "./types/Resultado";
import { ValoresSimulacao } from "./types/valores-simulacao";
import { AmortizacaoModalController, AmortizacaoModalResult } from "./ui/amortizacao-modal";
import { AmortizacoesListController } from "./ui/amortizacoes-list";
import { ColorModeController } from "./ui/color-mode-controller";
import { ConfirmationModalController } from "./ui/confirmation-modal";
import { FormController, FormNumericField, OnSubmitEventListener } from "./ui/form-controller";
import { GenericModalController } from "./ui/generic-modal";
import { SimulacaoResultController } from "./ui/simulacao-result-controller";

export class UI {
	public readonly amortizacoes: Array<Amortizacao> = [];

	private formController: FormController;
	private genericModal: GenericModalController;
	private confirmationModal: ConfirmationModalController;
	private amortizacaoModalController: AmortizacaoModalController;
	private amortizacoesListController: AmortizacoesListController;
	private colorModeController: ColorModeController;
	private simulacaoResultController: SimulacaoResultController;

	private onSubmitEventListener?: OnSubmitEventListener = undefined;

	constructor() {
		this.formController = new FormController(this.onSubmitEvent.bind(this));
		this.formController.setup();

		this.genericModal = new GenericModalController();
		this.confirmationModal = new ConfirmationModalController();

		this.amortizacoesListController = new AmortizacoesListController(this.confirmationModal);

		this.amortizacaoModalController = new AmortizacaoModalController();
		this.amortizacaoModalController.setup(result => this.handleAmortizacaoSubmit(result));

		this.colorModeController = new ColorModeController();
		this.colorModeController.setup();

		this.simulacaoResultController = new SimulacaoResultController();

		this.setupMask();
	}

	public submit() {
		this.formController.submit();
	}

	private onSubmitEvent(valores: ValoresSimulacao) {
		this.amortizacoes.length = 0;
		this.amortizacoes.push(...this.amortizacoesListController.getEntries().map(entry =>
			Amortizacao.parse(entry.periodo, valores.prazoMeses, entry.intervalo, entry.valor)
		));
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
		this.genericModal?.show(title, message, background);
	}

	public showAmortizacaoModal() {
		this.amortizacaoModalController?.show();
	}

	public showResultado(resultado: Resultado) {
		this.simulacaoResultController.render(resultado);
	}

	public getValoresSimulacao(): ValoresSimulacao {
		return this.formController.getValoresSimulacao();
	}

	private handleAmortizacaoSubmit(result: AmortizacaoModalResult) {
		this.amortizacoesListController?.addEntry(result);
	}

	private setupMask() {
		VMasker(document.querySelectorAll(".mask-money")).maskMoney({
			precision: 2,
			separator: ",",
			delimiter: ".",
			zeroCents: false
		});

		VMasker(document.querySelectorAll(".mask-number")).maskMoney({
			precision: 2,
			separator: ",",
			delimiter: ".",
			zeroCents: false
		});

		VMasker(document.querySelectorAll(".mask-integer")).maskMoney({
			precision: 0,
			separator: ",",
			delimiter: ".",
			zeroCents: false
		});
	}
}