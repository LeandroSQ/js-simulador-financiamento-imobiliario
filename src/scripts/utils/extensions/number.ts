declare global {
	interface Number {
		/** Formats the number as a currency string in the specified locale and options. Defaults to "pt-BR" and Brazilian Real (BRL). */
		toCurrencyString(locale?: string, options?: Intl.NumberFormatOptions): string;
	}
}

export {};

Number.prototype.toCurrencyString = function (this: number, locale: string = "pt-BR", options: Intl.NumberFormatOptions = { style: "currency", currency: "BRL" }): string {
	return this.toLocaleString(locale, options);
}