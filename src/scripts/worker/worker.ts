/**
 * Web Worker for performing mortgage simulation calculations.
 * Runs in a separate thread to avoid blocking the UI during heavy computations.
 */

import { SimuladorFinanciamento } from "../core/simulador-financiamento";
import { Amortizacao } from "../models/amortizacao";
import { WorkerRequest } from "../types/simulation";

/**
 * Handles incoming simulation requests from the main thread.
 */
self.onmessage = (event: MessageEvent) => {
	try {
		const { data } = event;
		const request = JSON.parse(data) as WorkerRequest;

		const extraAmortizations = request.amortizacoes.map(a => Amortizacao.fromJSON(a));
		const simulator = new SimuladorFinanciamento(request.valores, extraAmortizations);
		const result = simulator.calculate();

		const serializedResult = JSON.stringify(result);
		postMessage({ data: serializedResult });
	} catch (error) {
		console.error(error);
		console.trace(error);

		const errorMessage = error instanceof Error ? error.message : String(error);
		postMessage({ error: errorMessage });
	}
};