// Consolidated type exports
// Domain types (enums and core business concepts)
export * from "./domain";

// Simulation types (input, output, worker communication)
export * from "./simulation";

// UI types (color modes, modals, form fields, event handlers)
export * from "./ui";

// Legacy re-exports for backward compatibility
// These can be removed once all imports are updated

// From domain.ts
export { Tabela, Correcao, Periodo, PeriodoPrazo } from "./domain";
export type { PeriodoAmortizacao } from "./domain";

// From simulation.ts
export type {
	ValoresSimulacao,
	HistoricoMes,
	Resultado,
	AmortizacaoModalResult,
	AmortizacaoEntry,
	WorkerRequest,
	WorkerResponse
} from "./simulation";

// From ui.ts
export type {
	ColorMode,
	ModalBackground,
	ConfirmationModalOptions,
	FormNumericField,
	ColorModeChangeHandler,
	AmortizationModalSubmitHandler
} from "./ui";