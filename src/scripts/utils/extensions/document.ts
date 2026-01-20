/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */

declare global {
	interface Document {
		getElementByIdOrThrow<T extends HTMLElement = HTMLElement>(id: string): T;
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
