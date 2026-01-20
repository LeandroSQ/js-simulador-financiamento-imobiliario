import { SimuladorFinanciamento } from "../core/simulador-financiamento";
import { Amortizacao } from "../models/amortizacao";
import { WorkerRequest } from "../types";


self.onmessage = (event: MessageEvent) => {
	try {
		const { data } = event;
		const parsed = JSON.parse(data) as WorkerRequest;

		const amortizacoes = parsed.amortizacoes.map(a => Amortizacao.fromJSON(a));

		const simulador = new SimuladorFinanciamento(parsed.valores, amortizacoes);
		const result = simulador.calculate();

		const serialized = JSON.stringify(result);

		postMessage({ data: serialized });
	} catch (error) {
		console.error(error);
		console.trace(error);
		if (error instanceof Error) {
			postMessage({ error: error.message });
		} else {
			postMessage({ error: String(error) });
		}
	}
};