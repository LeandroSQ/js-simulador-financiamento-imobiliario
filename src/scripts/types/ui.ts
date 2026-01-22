/**
 * UI-related type definitions.
 * Contains types for color modes, modal options, form fields, and event handlers.
 */

import type { ExtraAmortizationInput } from "./simulation";

/**
 * Application color mode setting.
 * - "dark": Force dark theme
 * - "light": Force light theme
 * - null: Follow system preference
 */
export type ColorMode = "dark" | "light" | null;

/**
 * Bootstrap background color classes for modal headers.
 */
export type ModalBackground =
	| "bg-danger"
	| "bg-warning"
	| "bg-success"
	| "bg-info"
	| "bg-primary";

/**
 * Configuration options for the confirmation modal.
 */
export interface ConfirmationModalOptions {
	/** Modal title text */
	title: string;
	/** Modal body message */
	message: string;
	/** Text for the confirm button */
	confirmLabel?: string;
	/** Text for the cancel button */
	cancelLabel?: string;
	/** Background color class for the modal header */
	background?: ModalBackground;
}

/**
 * Form field identifiers for numeric input fields.
 */
export type FormNumericField =
	| "valor"
	| "entrada"
	| "juros"
	| "seguro"
	| "prazo"
	| "taxa-administracao";

/**
 * Callback type for color mode changes.
 */
export type ColorModeChangeHandler = (mode: ColorMode) => void;

/**
 * Callback type for extra amortization modal submissions.
 */
export type AmortizationModalSubmitHandler = (result: ExtraAmortizationInput) => void;