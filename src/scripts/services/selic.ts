export abstract class Selic {

	private static readonly BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.1178/dados";

	private static formatNumber(value: number, length: number = 2): string {
		return value.toString().padStart(length, "0");
	}

	private static formatDate(date: Date): string {
		return `${this.formatNumber(date.getDate())}/${this.formatNumber(date.getMonth() + 1)}/${this.formatNumber(date.getFullYear(), 4)}`;
	}

	private static async fetch(year: number): Promise<number> {
		// Pega um mês anterior ao atual para garantir que a taxa do ano anterior esteja disponível
		const startDate = new Date(year, new Date().getMonth() - 1, 1);
		const startDateString = this.formatDate(startDate);

		const response = await fetch(`${this.BASE_URL}?formato=json&dataInicial=${startDateString}`);
		const data = await response.json();
		const rate = data[data.length - 1]?.valor;

		if (rate === undefined) throw new Error("Não foi possível obter a taxa Selic para o período especificado");

		return rate;
	}

	/**
	 * Método que busca a taxa Selic acumulada em um determinado período anual.
	 */
	public static async getSelicRate(year: number | null = null): Promise<number> {
		if (year === null) year = new Date().getFullYear();
		
		const localStorageKey = `selic-${year}`;
		const cachedRate = (DEBUG ? localStorage : sessionStorage).getItem(localStorageKey);
		if (cachedRate) {
			console.log("Taxa Selic carregada do cache");
			return parseFloat(cachedRate);
		}

		const rate = await this.fetch(year);
		(DEBUG ? localStorage : sessionStorage).setItem(localStorageKey, rate.toString());

		return rate;
	}

}