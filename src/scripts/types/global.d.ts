declare global {
	interface Function {
		oneshot: (predicate: VoidFunction) => VoidFunction;
		debounce: (predicate: VoidFunction, amount: number) => VoidFunction;
	}

	interface Document {
		getElementByIdOrThrow<T extends HTMLElement>(id: string): T;
	}

	interface Number {
		toCurrencyString(locale?: string, options?: Intl.NumberFormatOptions): string;
		toShortCurrencyString(): string;
	}

	var DEBUG: boolean;
}

export {};