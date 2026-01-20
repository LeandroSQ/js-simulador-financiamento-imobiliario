import { PeriodoAmortizacao } from "../models/amortizacao";

export interface AmortizacaoModalResult {
	periodo: PeriodoAmortizacao;
	intervalo?: string;
	valor: number;
}
