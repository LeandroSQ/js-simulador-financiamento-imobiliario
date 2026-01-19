Number.prototype.toCurrencyString = function (this: number, locale: string = "pt-BR", options: Intl.NumberFormatOptions = { style: "currency", currency: "BRL" }): string {
	return this.toLocaleString(locale, options);
}