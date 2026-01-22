import "./utils/extensions";
import { Amortizacao } from "./models/amortizacao";
import { BCBRateService } from "./services/bcb-rate-service";
import { SimulationInput } from "./types";
import { UIController } from "./ui/ui-controller";
import { SimulationWorkerBinding } from "./worker/worker-binding";

class App {

	private ui!: UIController;
	private simulador = new SimulationWorkerBinding();

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
		const [selic, tr] = await Promise.all([
			BCBRateService.fetchSelicRate(year),
			BCBRateService.fetchTRRate(year)
		]);
		console.log(`Taxa Selic atual: ${selic.toFixed(2)}% ao ano`);
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
			{ periodo: "Mensal", valor: 1000, intervalo: "" },
			{ periodo: "Anual", valor: 10_000, intervalo: "" },
			{ periodo: "Bienal", valor: 35_000, intervalo: "" }
		]);

		setTimeout(() => {
			this.ui.submit();
		}, 250);
	}

	private async onSubmit(valores: SimulationInput) {
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