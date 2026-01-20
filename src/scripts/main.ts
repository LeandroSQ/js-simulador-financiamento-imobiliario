import "./extensions";
import { UI } from "./ui";
import { Selic } from "./selic";
import { WorkerBinding } from "./worker.binding";
import { ValoresSimulacao } from "./types/valores-simulacao";
import { TR } from "./tr";

class App {

	private ui!: UI;
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
			this.ui = new UI();
			this.ui.addEventListenerOnSubmit(this.onSubmit.bind(this));

			this.setupInitialValues();
		} catch (error) {
			console.error(error);
			console.trace(error);
			const message = error instanceof Error ? error.message : String(error);
			this.ui.showModal("Atenção!", message);
		}
	}

	private async setupSelic() {
		const selic = await Selic.getSelicRate();
		this.ui.setField("juros", selic);
	}


	private setupInitialValues() {
		if (!DEBUG) return;

		function FGTS(valorMensal: number, qtdMeses: number, taxa = 3.0) {
			const taxaMensal = Math.pow(1 + taxa / 100, 1 / 12) - 1;

			return valorMensal * (
				(Math.pow(1 + taxaMensal, qtdMeses) - 1) / taxaMensal
			);
		}

		this.ui.setField("valor", 350_000);
		this.ui.setField("entrada", 180_000);
		this.ui.setField("prazo", 35);
		this.ui.setField("juros", 11.29);
		this.ui.setField("seguro", 43.00);
		this.ui.setField("taxa-administracao", 25.00);
		this.ui.setAmortizacoes([
			// { periodo: "Mensal", valor: 1000.00, intervalo: undefined },
			{ periodo: "Bienal", valor: FGTS(1472, 24), intervalo: undefined },
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