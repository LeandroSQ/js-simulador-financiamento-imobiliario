/**
 * Domain-related type definitions for the mortgage simulation.
 * Contains enums and types that represent core business concepts.
 */

/**
 * Amortization system types.
 * @see https://en.wikipedia.org/wiki/Amortization_(business)
 */
export enum Tabela {
	/** Sistema de Amortização Constante - Constant Amortization System */
	SAC = "sac",
	/** Sistema de Amortização Francês (Tabela Price) - French Amortization System */
	PRICE = "price"
}

/**
 * Interest rate adjustment type.
 */
export enum Correcao {
	/** Pré-fixado - Fixed rate */
	PRE_FIXADO = "pre",
	/** Pós-fixado - Variable/adjustable rate */
	POS_FIXADO = "pos"
};

/**
 * Time period for rate or payment frequency.
 */
export type TimePeriod = "Anual" | "Mensal";

// Alias for backward compatibility
export type Periodo = TimePeriod;

/**
 * Unit for loan term specification.
 */
export type PeriodoPrazo = "Anos" | "Meses";

/**
 * Frequency options for extra amortization payments.
 */
export type PeriodoAmortizacao = "Anual" | "Mensal" | "Bienal" | "Outro";
