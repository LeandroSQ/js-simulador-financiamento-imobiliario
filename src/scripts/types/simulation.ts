/**
 * Simulation-related type definitions.
 * Contains interfaces for simulation input, output, and worker communication.
 */

import { Correcao, PeriodoAmortizacao, Tabela } from "./domain";

/**
 * Input parameters for the mortgage simulation.
 */
export interface SimulationInput {
	/** Total property value */
	valorImovel: number;
	/** Down payment amount */
	valorEntrada: number;
	/** Annual interest rate (as percentage, e.g., 10 for 10%) */
	taxaJurosAnual: number;
	/** Loan term in months */
	prazoMeses: number;
	/** Monthly administration fee */
	taxaAdministracaoMensal: number;
	/** Monthly insurance fee */
	seguroMensal: number;
	/** Amortization system (SAC or PRICE) */
	tabela: Tabela;
	/** Rate adjustment type (fixed or variable) */
	correcao: Correcao;
	/** Projected interest rate for future calculations */
	projecaoTaxaJuros: number;
}

// Alias for backward compatibility - both types are identical
export type ValoresSimulacao = SimulationInput;

/**
 * Monthly breakdown of loan payments and balances.
 */
export interface MonthlyBreakdown {
	/** Monthly payment amount (principal + interest) */
	valorParcela: number;
	/** Interest portion of the payment */
	valorJuros: number;
	/** Principal (amortization) portion of the payment */
	valorAmortizacao: number;
	/** Remaining balance after this payment */
	saldoDevedor: number;
	/** Total charges including fees (payment + insurance + admin fee) */
	valorEncargo: number;
}

// Alias for backward compatibility
export type HistoricoMes = MonthlyBreakdown;

/**
 * Complete simulation result with summary and payment schedule.
 */
export interface SimulationResult {
	/** Amount financed (property value - down payment) */
	valorFinanciado: number;
	/** First payment amount including all charges */
	valorParcelaInicial: number;
	/** Last payment amount including all charges */
	valorParcelaFinal: number;
	/** Month-by-month payment breakdown */
	evolucao: MonthlyBreakdown[];
	/** Total effective cost (principal + interest + fees) */
	custoTotalEfetivo: number;
	/** Total interest paid over the loan term */
	valorTotalJuros: number;
	/** Total extra amortization paid */
	valorTotalAmortizado: number;
	/** Monthly insurance amount */
	seguroMensal: number;
	/** Monthly administration fee */
	taxaAdministracaoMensal: number;
}

// Alias for backward compatibility
export type Resultado = SimulationResult;

/**
 * Data structure for extra amortization entry (user input).
 */
export interface ExtraAmortizationInput {
	/** Frequency of the extra payment */
	periodo: PeriodoAmortizacao;
	/** Custom interval string (for "Outro" period type) */
	intervalo?: string;
	/** Payment amount */
	valor: number;
}

// Alias for backward compatibility
export type AmortizacaoModalResult = ExtraAmortizationInput;

/**
 * Internal representation of an extra amortization entry with DOM element reference.
 */
export interface ExtraAmortizationEntry {
	/** User input data */
	data: ExtraAmortizationInput;
	/** DOM element representing this entry in the list */
	element: HTMLElement;
}

// Alias for backward compatibility
export type AmortizacaoEntry = ExtraAmortizationEntry;

/**
 * Serialized amortization data for worker communication.
 */
export interface SerializedAmortization {
	type: PeriodoAmortizacao;
	prazoMeses?: number;
	input?: string;
	valor: number;
}

/**
 * Request payload sent to the simulation worker.
 */
export interface WorkerRequest {
	/** Simulation input parameters */
	valores: SimulationInput;
	/** List of extra amortizations (serialized) */
	amortizacoes: SerializedAmortization[];
}

/**
 * Response payload received from the simulation worker.
 */
export interface WorkerResponse {
	/** Serialized simulation result (on success) */
	data?: string;
	/** Error message (on failure) */
	error?: string;
}
