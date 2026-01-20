const moneyMaskClasses = [
	"mask-money",
	"mask-number"
];

const numericRegExp = /[\d,.]/;

function parseMaskedValue(value: string): number {
	let parsedValue: string | number = value;
	if (parsedValue.includes(",")) {
		if (parsedValue.includes(".")) {
			parsedValue = parsedValue.replace(/\./g, "").replace(/\,/g, ".");
		} else {
			parsedValue = parsedValue.replace(/\,/g, ".");
		}
	}

	return parseFloat(parsedValue);
}

export interface ParseNumericFieldOptions {
	required?: boolean;
	defaultValue?: number;
}

export function parseNumericField(field: HTMLInputElement, options: ParseNumericFieldOptions & { required: true }): number;
export function parseNumericField(field: HTMLInputElement, options?: ParseNumericFieldOptions): number | null;
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

	if (!numericRegExp.test(rawValue)) {
		return NaN;
	}

	return parseMaskedValue(rawValue);
}

export function validateMaskedNumericField(field: HTMLInputElement) {
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

export function setNumericFieldValue(field: HTMLInputElement, value: number) {
	const isMasked = Array.from(field.classList.values()).some(cls => moneyMaskClasses.includes(cls));
	field.value = isMasked ? value.toFixed(2) : value.toString();
	field.dispatchEvent(new Event("input", { bubbles: true }));
	field.dispatchEvent(new Event("keyup"));
}
