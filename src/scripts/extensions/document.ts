document.getElementByIdOrThrow = function <T extends HTMLElement>(this: Document, id: string): T {
	const element = this.getElementById(id) as T | null;
	if (!element) {
		throw new Error(`Elemento '${id}' não encontrado`);
	}
	return element;
};
