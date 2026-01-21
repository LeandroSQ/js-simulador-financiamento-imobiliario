declare global {
	interface Number {
		/** Formats the number as a currency string in the specified locale and options. Defaults to "pt-BR" and Brazilian Real (BRL). */
		toCurrencyString(locale?: string, options?: Intl.NumberFormatOptions): string;
		/** Formats the number as a short currency string (e.g., R$ 1,5M, R$ 150k). Useful for chart labels. */
		toShortCurrencyString(): string;
	}
}

export {};

Number.prototype.toCurrencyString = function (this: number, locale: string = "pt-BR", options: Intl.NumberFormatOptions = { style: "currency", currency: "BRL" }): string {
	return this.toLocaleString(locale, options);
};

Number.prototype.toShortCurrencyString = function (this: number): string {
	const absValue = Math.abs(this);
	const sign = this < 0 ? "-" : "";

	if (absValue >= 1_000_000) {
		return `${sign}R$ ${(absValue / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}M`;
	} else if (absValue >= 1_000) {
		return `${sign}R$ ${(absValue / 1_000).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}k`;
	}
	return `${sign}R$ ${absValue.toLocaleString("pt-BR", { maximumFractionDigits: 0 })}`;
};