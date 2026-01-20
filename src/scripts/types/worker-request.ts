import { Amortizacao } from "../models/amortizacao";

import { ValoresSimulacao } from "./valores-simulacao";

export interface WorkerRequest {
	valores: ValoresSimulacao;
	amortizacoes: Amortizacao[];
}
