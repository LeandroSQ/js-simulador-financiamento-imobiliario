import "./utils/extensions";
import { Amortizacao } from "./amortizacao";
import { Selic } from "./services/selic";
import { TR } from "./services/tr";
import { ValoresSimulacao } from "./types/valores-simulacao";
import { UIController } from "./ui/ui-controller";
import { WorkerBinding } from "./worker/worker-binding";

class App {

	private ui!: UIController;
	private simulador = new WorkerBinding();

	constructor() {
		const callback = Function.oneshot<VoidFunction>(this.setup.bind(this));
		window.addEventListener("DOMContentLoaded", callback);
		window.addEventListener("load", callback);
		document.addEventListener("load", callback);
		window.addEventListener("ready", callback);
		setTimeout(callback, 1500);
	}

	public async setup() {
		try {
			this.ui = new UIController();
			this.ui.addEventListenerOnSubmit(this.onSubmit.bind(this));

			this.setupInitialValues();
			await this.fetchRates();
		} catch (error) {
			console.error(error);
			console.trace(error);
			const message = error instanceof Error ? error.message : String(error);
			this.ui.showModal("Atenção!", message);
		}
	}

	private async fetchRates() {
		const year = new Date().getFullYear();
		const selic = await Selic.fetchRate(year);
		// const cdi = await Selic.getCdiRate();
		const tr = await TR.fetchRate(year);
		console.log(`Taxa Selic atual: ${selic.toFixed(2)}% ao ano`);
		// console.log(`Taxa CDI atual: ${cdi.toFixed(2)}% ao ano`);
		console.log(`Taxa TR atual: ${tr.toFixed(2)}% ao ano`);

		this.ui.setupRates(selic, tr, year);
	}

	private setupInitialValues() {
		if (!DEBUG) return;

		this.ui.setField("valor", 350_000);
		this.ui.setField("entrada", 180_000);
		this.ui.setField("prazo", 35);
		this.ui.setField("juros", 11.29);
		this.ui.setField("seguro", 43.00);
		this.ui.setField("taxa-administracao", 25.00);
		this.ui.setAmortizacoes([
			{
				periodo: "Mensal",
				valor: 1000,
				intervalo: "",
			}
		]);

		setTimeout(() => {
			this.ui.submit();
		}, 250);
	}

	private async onSubmit(valores: ValoresSimulacao) {
		console.log("Simulação iniciada");
		console.log(valores);

		const amortizacoesExtraordinarias = this.ui.amortizacoes;
		console.log("Amortizações extraordinárias:");
		console.log(amortizacoesExtraordinarias);

		const result = await this.simulador.calculate(valores, amortizacoesExtraordinarias);
		console.log(result);
		this.ui.showResultado(result);
	}

}

new App();