/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */

declare global {
	interface Document {
		getElementByIdOrThrow<T extends HTMLElement = HTMLElement>(id: string): T;
		getVar(varName: string): string;
		get devicePixelRatio(): number;
	}
}

export {};

document.getElementByIdOrThrow = function <T extends HTMLElement = HTMLElement>(this: Document, id: string): T {
	const element = this.getElementById(id) as T | null;
	if (!element) {
		throw new Error(`Elemento '${id}' não encontrado`);
	}
	return element;
};

Object.defineProperty(document, "devicePixelRatio", {
	get() {
		return window.devicePixelRatio || 1;
	},
});

document.getVar = (varName: string): string => {
	const styles = getComputedStyle(document.documentElement);
	const value = styles.getPropertyValue(varName).trim();

	if (value.startsWith("#") || value.startsWith("rgb")) return value;
	return `rgb(${value})`;
};
