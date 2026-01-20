import { Correcao } from "../types/correcao";
import { Tabela } from "../types/tabela";
import { ValoresSimulacao } from "../types/valores-simulacao";
import { parseNumericField, setNumericFieldValue, validateMaskedNumericField } from "./numeric-field";

export type Periodo = "Anual" | "Mensal";
export type PeriodoPrazo = "Anos" | "Meses";

export type OnSubmitEventListener = (values: ValoresSimulacao) => void;

export type FormNumericField = "valor" | "entrada" | "juros" | "seguro" | "prazo" | "taxa-administracao";


export class FormController {
	private readonly inputValor: HTMLInputElement;
	private readonly inputEntrada: HTMLInputElement;
	private readonly inputJuros: HTMLInputElement;
	private readonly selectJurosPeriodo: HTMLSelectElement;
	private readonly selectJurosCorrecao: HTMLSelectElement;
	private readonly inputSeguro: HTMLInputElement;
	private readonly selectSeguroPeriodo: HTMLSelectElement;
	private readonly inputTaxaAdministracao: HTMLInputElement;
	private readonly inputTaxaAdministracaoPeriodo: HTMLSelectElement;
	private readonly inputPrazo: HTMLInputElement;
	private readonly selectPrazoPeriodo: HTMLSelectElement;
	private readonly selectTabela: HTMLSelectElement;
	private readonly submitButton: HTMLButtonElement;
	private readonly numericFields: HTMLInputElement[];
	private readonly formFields: Array<HTMLInputElement | HTMLSelectElement>;
	private readonly debouncedAutoSubmit: VoidFunction;

	private static readonly AUTO_SUBMIT_DELAY = 350;

	constructor(private readonly onSubmit: OnSubmitEventListener) {
		this.inputValor = document.getElementByIdOrThrow<HTMLInputElement>("valor");
		this.inputEntrada = document.getElementByIdOrThrow<HTMLInputElement>("entrada");
		this.inputJuros = document.getElementByIdOrThrow<HTMLInputElement>("juros");
		this.selectJurosPeriodo = document.getElementByIdOrThrow<HTMLSelectElement>("juros-periodo");
		this.selectJurosCorrecao = document.getElementByIdOrThrow<HTMLSelectElement>("juros-correcao");
		this.inputSeguro = document.getElementByIdOrThrow<HTMLInputElement>("seguro");
		this.selectSeguroPeriodo = document.getElementByIdOrThrow<HTMLSelectElement>("seguro-periodo");
		this.inputPrazo = document.getElementByIdOrThrow<HTMLInputElement>("prazo");
		this.selectPrazoPeriodo = document.getElementByIdOrThrow<HTMLSelectElement>("prazo-periodo");
		this.inputTaxaAdministracao = document.getElementByIdOrThrow<HTMLInputElement>("taxa-administracao");
		this.inputTaxaAdministracaoPeriodo = document.getElementByIdOrThrow<HTMLSelectElement>("taxa-administracao-periodo");
		this.selectTabela = document.getElementByIdOrThrow<HTMLSelectElement>("tabela");
		this.submitButton = document.getElementByIdOrThrow<HTMLButtonElement>("submit");

		this.numericFields = [
			this.inputValor,
			this.inputEntrada,
			this.inputJuros,
			this.inputSeguro,
			this.inputTaxaAdministracao,
			this.inputPrazo
		];

		this.formFields = [
			...this.numericFields,
			this.selectJurosPeriodo,
			this.selectJurosCorrecao,
			this.selectSeguroPeriodo,
			this.inputTaxaAdministracaoPeriodo,
			this.selectPrazoPeriodo,
			this.selectTabela
		];

		this.debouncedAutoSubmit = Function.debounce(() => this.submitIfValid(), FormController.AUTO_SUBMIT_DELAY);
	}

	public setup() {
		this.setupFormListeners();
		window.setTimeout(() => this.validateForm(), 100);
	}

	public setField(field: FormNumericField, value: number) {
		switch (field) {
			case "valor":
				setNumericFieldValue(this.inputValor, value);
				break;
			case "entrada":
				setNumericFieldValue(this.inputEntrada, value);
				break;
			case "juros":
				setNumericFieldValue(this.inputJuros, value);
				break;
			case "seguro":
				setNumericFieldValue(this.inputSeguro, value);
				break;
			case "prazo":
				setNumericFieldValue(this.inputPrazo, value);
				break;
			case "taxa-administracao":
				setNumericFieldValue(this.inputTaxaAdministracao, value);
				break;
			default:
				const exhaustiveCheck: never = field;
				throw new Error(`Campo '${exhaustiveCheck}' não suportado`);
		}
	}

	public submit() {
		this.trySubmit();
	}

	public submitIfValid(): boolean {
		return this.trySubmit();
	}

	private setupFormListeners() {
		this.submitButton.addEventListener("click", event => this.handleSubmit(event));

		const handleFieldInteraction = () => {
			if (this.validateForm()) {
				this.debouncedAutoSubmit();
			}
		};

		for (const field of this.formFields) {
			field.addEventListener("input", handleFieldInteraction);
			field.addEventListener("change", handleFieldInteraction);
		}
	}

	private validateForm(): boolean {
		this.numericFields.forEach(validateMaskedNumericField);
		this.numericFields.forEach(field => field.reportValidity());

		const isValid = this.formFields.every(field => field.checkValidity());
		this.submitButton.toggleAttribute("disabled", !isValid);
		return isValid;
	}

	private handleSubmit(event: Event) {
		event.preventDefault();
		this.trySubmit();
	}

	private trySubmit(): boolean {
		const isValid = this.validateForm();
		if (!isValid) return false;

		this.onSubmit(this.collectValoresSimulacao());
		return true;
	}

	public getValoresSimulacao(): ValoresSimulacao {
		return this.collectValoresSimulacao();
	}

	private collectValoresSimulacao(): ValoresSimulacao {
		const valorImovel = parseNumericField(this.inputValor, { required: true });
		const valorEntrada = parseNumericField(this.inputEntrada, { required: true });
		const taxaJurosBruta = parseNumericField(this.inputJuros, { required: true });
		const taxaJurosPeriodo = this.selectJurosPeriodo.value as Periodo;
		const correcao = this.selectJurosCorrecao.value as Correcao;
		const seguroBruto = parseNumericField(this.inputSeguro, { defaultValue: 0 }) ?? 0;
		const taxaAdministracaoBruta = parseNumericField(this.inputTaxaAdministracao, { defaultValue: 0 }) ?? 0;
		const seguroPeriodoValor = this.selectSeguroPeriodo.value as Periodo;
		const taxaAdministracaoPeriodoValor = this.inputTaxaAdministracaoPeriodo.value as Periodo;
		const prazoBruto = parseNumericField(this.inputPrazo, { required: true });
		const prazoPeriodoValor = this.selectPrazoPeriodo.value as PeriodoPrazo;
		const tabelaValue = this.selectTabela.value as Tabela;

		const taxaJurosAnual = taxaJurosBruta / (taxaJurosPeriodo === "Anual" ? 1 : 12);
		const prazoMeses = prazoBruto * (prazoPeriodoValor === "Anos" ? 12 : 1);
		const taxaAdministracaoMensal = taxaAdministracaoBruta / (taxaAdministracaoPeriodoValor === "Anual" ? 12 : 1);
		const seguroMensal = seguroBruto / (seguroPeriodoValor === "Anual" ? 12 : 1);

		return {
			valorImovel,
			valorEntrada,
			taxaJurosAnual,
			prazoMeses,
			tabela: tabelaValue,
			correcao,
			projecaoTaxaJuros: 0,
			taxaAdministracaoMensal,
			seguroMensal
		};
	}
}
