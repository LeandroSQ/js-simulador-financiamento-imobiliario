import { ValoresSimulacao } from "./types/valores-simulacao";
import { SimuladorFinanciamento } from "./simulador";
import { Amortizacao } from "./amortizacao";

type WorkerRequest = {
	valores: ValoresSimulacao;
	amortizacoes: Amortizacao[];
};

self.onmessage = async (event: MessageEvent) => {
	try {
		const { data } = event;
		const parsed = JSON.parse(data) as WorkerRequest;

		const simulador = new SimuladorFinanciamento(parsed.valores, parsed.amortizacoes);
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