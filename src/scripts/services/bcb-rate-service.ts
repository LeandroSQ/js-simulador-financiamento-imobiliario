/**
 * Service for fetching interest rates from the Brazilian Central Bank (BCB) API.
 * Consolidates SELIC and TR rate fetching with shared caching logic.
 */

export enum RateType {
	/** Taxa SELIC - Sistema Especial de Liquidação e de Custódia */
	SELIC = "1178",
	/** Taxa Referencial */
	TR = "226"
}

const RATE_NAMES: Record<RateType, string> = {
	[RateType.SELIC]: "Selic",
	[RateType.TR]: "TR"
};

export abstract class BCBRateService {

	private static readonly BASE_URL = "https://api.bcb.gov.br/dados/serie/bcdata.sgs";

	private static formatNumber(value: number, length: number = 2): string {
		return value.toString().padStart(length, "0");
	}

	private static formatDate(date: Date): string {
		const day = this.formatNumber(date.getDate());
		const month = this.formatNumber(date.getMonth() + 1);
		const year = this.formatNumber(date.getFullYear(), 4);
		return `${day}/${month}/${year}`;
	}

	private static normalizeRate(rawRate: unknown, rateType: RateType): number {
		const normalized = parseFloat(String(rawRate).replace(",", "."));
		if (Number.isNaN(normalized)) {
			const rateName = RATE_NAMES[rateType];
			throw new Error(`Não foi possível obter a taxa ${rateName} para o período especificado`);
		}
		return normalized;
	}

	private static getCacheKey(rateType: RateType, year: number): string {
		const rateName = RATE_NAMES[rateType].toLowerCase();
		return `${rateName}-${year}`;
	}

	private static getCache(): Storage {
		return DEBUG ? localStorage : sessionStorage;
	}

	private static getFromCache(rateType: RateType, year: number): number | null {
		const key = this.getCacheKey(rateType, year);
		const cached = this.getCache().getItem(key);
		if (cached) {
			const rateName = RATE_NAMES[rateType];
			console.log(`Taxa ${rateName} carregada do cache`);
			return parseFloat(cached);
		}
		return null;
	}

	private static saveToCache(rateType: RateType, year: number, rate: number): void {
		const key = this.getCacheKey(rateType, year);
		this.getCache().setItem(key, rate.toString());
	}

	private static async fetchFromAPI(rateType: RateType, year: number): Promise<number> {
		// Fetch from one month before current to ensure data availability
		const startDate = new Date(year, new Date().getMonth() - 1, 1);
		const startDateString = this.formatDate(startDate);

		const url = `${this.BASE_URL}.${rateType}/dados?formato=json&dataInicial=${startDateString}`;
		const response = await fetch(url);
		const data = await response.json();
		const rawRate = data[data.length - 1]?.valor;

		return this.normalizeRate(rawRate, rateType);
	}

	/**
	 * Fetches a rate from the BCB API with caching support.
	 */
	public static async fetchRate(rateType: RateType, year: number | null = null): Promise<number> {
		const targetYear = year ?? new Date().getFullYear();

		const cachedRate = this.getFromCache(rateType, targetYear);
		if (cachedRate !== null) {
			return cachedRate;
		}

		const rate = await this.fetchFromAPI(rateType, targetYear);
		this.saveToCache(rateType, targetYear, rate);

		return rate;
	}

	/**
	 * Fetches the accumulated SELIC rate for the specified year.
	 */
	public static fetchSelicRate(year: number | null = null): Promise<number> {
		return this.fetchRate(RateType.SELIC, year);
	}

	/**
	 * Fetches the accumulated TR rate for the specified year.
	 */
	public static fetchTRRate(year: number | null = null): Promise<number> {
		return this.fetchRate(RateType.TR, year);
	}

}
