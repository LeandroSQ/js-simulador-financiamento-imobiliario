export abstract class TR {

	private static readonly BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.226/dados";

	private static formatNumber(value: number, length: number = 2): string {
		return value.toString().padStart(length, "0");
	}

	private static formatDate(date: Date): string {
		return `${this.formatNumber(date.getDate())}/${this.formatNumber(date.getMonth() + 1)}/${this.formatNumber(date.getFullYear(), 4)}`;
	}

	private static normalizeRate(rawRate: unknown): number {
		const normalized = parseFloat(String(rawRate).replace(",", "."));
		if (Number.isNaN(normalized)) throw new Error("Não foi possível obter a taxa TR para o período especificado");
		return normalized;
	}

	private static async fetch(year: number): Promise<number> {
		// Pega um mês anterior ao atual para garantir que a taxa do ano anterior esteja disponível
		const startDate = new Date(year, new Date().getMonth() - 1, 1);
		const startDateString = this.formatDate(startDate);

		const response = await fetch(`${this.BASE_URL}?formato=json&dataInicial=${startDateString}`);
		const data = await response.json();
		const rawRate = data[data.length - 1]?.valor;

		return this.normalizeRate(rawRate);
	}

	/**
	 * Busca a taxa TR acumulada em um determinado período anual.
	 */
	public static async getTRRate(year: number | null = null): Promise<number> {
		if (year === null) year = new Date().getFullYear();

		const localStorageKey = `tr-${year}`;
		const cachedRate = (DEBUG ? localStorage : sessionStorage).getItem(localStorageKey);
		if (cachedRate) {
			console.log("Taxa TR carregada do cache");
			return parseFloat(cachedRate);
		}

		const rate = await this.fetch(year);
		(DEBUG ? localStorage : sessionStorage).setItem(localStorageKey, rate.toString());

		return rate;
	}

}
