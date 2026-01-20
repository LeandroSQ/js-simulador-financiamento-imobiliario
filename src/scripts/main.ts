import "./utils/extensions";
import { UIController } from "./ui/ui-controller";
import { Selic } from "./services/selic";
import { WorkerBinding } from "./worker/worker-binding";
import { ValoresSimulacao } from "./types/valores-simulacao";
import { TR } from "./services/tr";

class App {

	private ui!: UIController;
	private simulador = new WorkerBinding();

	constructor() {
		const callback = Function.oneshot(this.setup.bind(this));
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

		this.ui.setField("valor", 600_000);
		this.ui.setField("entrada", 200_000);
		this.ui.setField("prazo", 35);
		this.ui.setField("juros", 14.29);
		this.ui.setField("seguro", 46.00);
		this.ui.setField("taxa-administracao", 30.00);
		this.ui.setAmortizacoes([]);

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