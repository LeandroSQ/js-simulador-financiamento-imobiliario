/**
 * Utilities for handling masked numeric input fields.
 * Provides parsing, validation, and value setting for Brazilian currency/number formats.
 */

/** CSS classes that indicate a masked numeric input */
const MASKED_INPUT_CLASSES = [
	"mask-money",
	"mask-number"
] as const;

/** Regex to match valid numeric characters (digits, comma, period) */
const NUMERIC_PATTERN = /[\d,.]/;

/**
 * Parses a Brazilian-formatted numeric string to a JavaScript number.
 * Handles formats like "1.234,56" (Brazilian) or "1234.56" (standard).
 *
 * @param value - The formatted string to parse
 * @returns The parsed number
 */
function parseBrazilianNumber(value: string): number {
	let normalized = value;

	if (normalized.includes(",")) {
		if (normalized.includes(".")) {
			// Brazilian format: 1.234,56 -> 1234.56
			normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
		} else {
			// Simple decimal comma: 1234,56 -> 1234.56
			normalized = normalized.replace(/,/g, ".");
		}
	}

	return parseFloat(normalized);
}

/**
 * Options for parsing a numeric input field.
 */
export interface ParseNumericFieldOptions {
	/** If true, throws an error when the field is empty (unless defaultValue is set) */
	required?: boolean;
	/** Default value to return when the field is empty */
	defaultValue?: number;
}

/**
 * Parses the value from a masked numeric input field.
 * Overload for required fields - always returns a number.
 */
export function parseNumericField(field: HTMLInputElement, options: ParseNumericFieldOptions & { required: true }): number;

/**
 * Parses the value from a masked numeric input field.
 * Overload for optional fields - may return null.
 */
export function parseNumericField(field: HTMLInputElement, options?: ParseNumericFieldOptions): number | null;

/**
 * Parses the value from a masked numeric input field.
 *
 * @param field - The input element to parse
 * @param options - Parsing options (required, defaultValue)
 * @returns The parsed number, or null if empty and not required
 * @throws Error if field is required but empty (and no defaultValue)
 */
export function parseNumericField(field: HTMLInputElement, options: ParseNumericFieldOptions = {}): number | null {
	const { required = false, defaultValue } = options;
	const rawValue = field.value;

	if (!rawValue) {
		if (required) {
			if (typeof defaultValue === "number") return defaultValue;
			throw new Error(`Campo '${field.id}' é obrigatório`);
		}
		return typeof defaultValue === "number" ? defaultValue : null;
	}

	if (!NUMERIC_PATTERN.test(rawValue)) {
		return NaN;
	}

	return parseBrazilianNumber(rawValue);
}

/**
 * Validates a masked numeric input field and sets its custom validity.
 * Checks against min/max attributes and required state.
 *
 * @param field - The input element to validate
 */
export function validateMaskedNumericField(field: HTMLInputElement): void {
	const minAttr = field.getAttribute("min");
	const maxAttr = field.getAttribute("max");
	const requiredAttr = field.getAttribute("required");

	const min = minAttr ? parseFloat(minAttr) : undefined;
	const max = maxAttr ? parseFloat(maxAttr) : undefined;
	const required = requiredAttr !== null;

	let value: number | null;
	try {
		value = parseNumericField(field, { required });
	} catch {
		field.setCustomValidity(required ? "Campo obrigatório" : "");
		return;
	}

	if (value === null) {
		field.setCustomValidity(required ? "Campo obrigatório" : "");
		return;
	}

	if (Number.isNaN(value)) {
		field.setCustomValidity("Valor inválido");
		return;
	}

	if (typeof min === "number" && value < min) {
		field.setCustomValidity("Valor abaixo do mínimo");
		return;
	}

	if (typeof max === "number" && value > max) {
		field.setCustomValidity("Valor acima do máximo");
		return;
	}

	field.setCustomValidity("");
}

/**
 * Sets the value of a numeric input field, handling masked inputs appropriately.
 * Triggers input and keyup events to ensure masks are applied.
 *
 * @param field - The input element to update
 * @param value - The numeric value to set
 */
export function setNumericFieldValue(field: HTMLInputElement, value: number): void {
	const isMasked = Array.from(field.classList.values())
		.some(cls => MASKED_INPUT_CLASSES.includes(cls as typeof MASKED_INPUT_CLASSES[number]));

	field.value = isMasked ? value.toFixed(2) : value.toString();

	// Trigger events to update mask
	field.dispatchEvent(new Event("input", { bubbles: true }));
	field.dispatchEvent(new Event("keyup"));
}

