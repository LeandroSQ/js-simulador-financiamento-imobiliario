import { Amortizacao } from "../models/amortizacao";
import { Resultado } from "../types/resultado";
import { ValoresSimulacao } from "../types/valores-simulacao";
import { WorkerResponse } from "../types/worker-response";

export class WorkerBinding {

	private readonly worker: Worker;

	private resolve?: (value: Resultado) => void = undefined;
	private reject?: (error: Error) => void = undefined;

	constructor() {
		this.worker = new Worker(`${window.location.href}scripts/worker/worker.js`);
		this.worker.addEventListener("message", this.onMessage.bind(this));
		this.worker.addEventListener("error", this.onError.bind(this));
		this.worker.addEventListener("messageerror", this.onMessageError.bind(this));
	}

	public calculate(valores: ValoresSimulacao, amortizacoes: Amortizacao[]): Promise<Resultado> {
		return new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;

			const serialized = JSON.stringify({
				valores,
				amortizacoes 
			});
			this.worker.postMessage(serialized);
		});
	}

	private onMessage(event: MessageEvent<WorkerResponse>) {
		const { data } = event;
		if (data.error) {
			console.error(data.error);
			this.reject?.call(this, new Error(data.error));
		} else {
			if (data.data) {
				const deserialized = JSON.parse(data.data) as Resultado;
				this.resolve?.call(this, deserialized);
			} else {
				this.reject?.call(this, new Error("Erro de comunicação com o worker"));
			}
		}
	}

	private onError(event: ErrorEvent) {
		console.error(event);
		this.reject?.call(this, new Error(event.message));
	}

	private onMessageError(event: MessageEvent) {
		console.error(event);
		this.reject?.call(this, new Error("Erro de comunicação com o worker"));
	}

}