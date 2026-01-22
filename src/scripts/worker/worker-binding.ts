import { Amortizacao } from "../models/amortizacao";
import { SimulationInput, SimulationResult, WorkerResponse } from "../types/simulation";

/**
 * Client for communicating with the simulation Web Worker.
 * Handles serialization, message passing, and error handling.
 */
export class SimulationWorkerBinding {

	private readonly worker: Worker;

	private pendingResolve?: (value: SimulationResult) => void;
	private pendingReject?: (error: Error) => void;

	constructor() {
		this.worker = new Worker(`${window.location.href}scripts/worker/worker.js`);
		this.worker.addEventListener("message", this.handleMessage.bind(this));
		this.worker.addEventListener("error", this.handleError.bind(this));
		this.worker.addEventListener("messageerror", this.handleMessageError.bind(this));
	}

	/**
	 * Sends simulation parameters to the worker and returns the result.
	 * @param input - Simulation input parameters
	 * @param extraAmortizations - List of extra amortization schedules
	 * @returns Promise resolving to the simulation result
	 */
	public calculate(input: SimulationInput, extraAmortizations: Amortizacao[]): Promise<SimulationResult> {
		return new Promise((resolve, reject) => {
			this.pendingResolve = resolve;
			this.pendingReject = reject;

			const payload = JSON.stringify({
				valores: input,
				amortizacoes: extraAmortizations
			});
			this.worker.postMessage(payload);
		});
	}

	private handleMessage(event: MessageEvent<WorkerResponse>): void {
		const { data } = event;

		if (data.error) {
			console.error(data.error);
			this.pendingReject?.call(this, new Error(data.error));
			return;
		}

		if (data.data) {
			const result = JSON.parse(data.data) as SimulationResult;
			this.pendingResolve?.call(this, result);
		} else {
			this.pendingReject?.call(this, new Error("Erro de comunicação com o worker"));
		}
	}

	private handleError(event: ErrorEvent): void {
		console.error(event);
		this.pendingReject?.call(this, new Error(event.message));
	}

	private handleMessageError(event: MessageEvent): void {
		console.error(event);
		this.pendingReject?.call(this, new Error("Erro de comunicação com o worker"));
	}

}

// Alias for backward compatibility
export { SimulationWorkerBinding as WorkerBinding };