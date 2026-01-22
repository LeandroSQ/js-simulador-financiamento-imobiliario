/**
 * Extra Amortization Payment Models
 *
 * Represents additional payments that can be made beyond regular monthly installments.
 * Supports various frequencies: monthly, annual, biennial, or custom schedules.
 */

/** Supported amortization frequency types */
export type PeriodoAmortizacao = "Anual" | "Mensal" | "Bienal" | "Outro";

/**
 * Abstract base class for extra amortization payments.
 * Implementations define when payments apply based on the loan month.
 */
export abstract class Amortizacao {

	constructor(public readonly valor: number) {}

	/** The frequency type of this amortization */
	public abstract readonly type: PeriodoAmortizacao;

	/**
	 * Determines if this amortization applies to a specific month.
	 * @param month - The loan month number (1-based)
	 * @returns true if payment should be applied in this month
	 */
	public abstract appliesTo(month: number): boolean;

	/**
	 * Factory method to create the appropriate amortization type.
	 * @param periodo - The payment frequency
	 * @param prazoMeses - Total loan term in months (for custom intervals)
	 * @param customInterval - Custom interval string (for "Outro" type)
	 * @param valor - Payment amount
	 * @returns The appropriate Amortizacao subclass instance
	 */
	public static create(
		periodo: PeriodoAmortizacao,
		prazoMeses: number,
		customInterval: string | undefined,
		valor: number
	): Amortizacao {
		switch (periodo) {
			case "Mensal":
				return new AmortizationMensal(valor);
			case "Anual":
				return new AmortizationAnual(valor);
			case "Bienal":
				return new AmortizationBienal(valor);
			case "Outro":
				return new AmortizationCustom(valor, customInterval, prazoMeses);
			default:
				const exhaustiveCheck: never = periodo;
				throw new Error(`Período de amortização inválido: ${exhaustiveCheck}`);
		}
	}

	public static fromJSON(json: any): Amortizacao {
		const termMonths = json.termMonths ?? json.prazoMeses ?? 0;
		return Amortizacao.create(json.type, termMonths, json.input, json.valor);
	}

	/**
	 * Validates a custom interval string without creating an instance.
	 * @param input - Custom interval string to validate
	 * @throws Error if the interval format is invalid
	 */
	public static validateCustomInterval(input: string | undefined): void {
		AmortizationCustom.parseIntervalString(input);
	}

}

/**
 * Monthly amortization - applies every month.
 */
class AmortizationMensal extends Amortizacao {

	public readonly type = "Mensal" as const;

	public appliesTo(): boolean {
		return true;
	}

}

/**
 * Annual amortization - applies every 12 months.
 */
class AmortizationAnual extends Amortizacao {

	public readonly type = "Anual" as const;

	public appliesTo(month: number): boolean {
		return month % 12 === 0;
	}

}

/**
 * Biennial amortization - applies every 24 months.
 */
class AmortizationBienal extends Amortizacao {

	public readonly type = "Bienal" as const;

	public appliesTo(month: number): boolean {
		return month % 24 === 0;
	}

}

/** Represents a range of months for custom amortization */
interface MonthRange {
	start: number;
	end: number;
}

/**
 * Custom amortization - applies to user-specified months or ranges.
 * Supports formats like "1,3,5" for specific months or "1-5" for ranges.
 */
export class AmortizationCustom extends Amortizacao {

	public readonly type = "Outro" as const;
	private readonly ranges: MonthRange[];

	constructor(
		amount: number,
		public readonly input: string | undefined,
		public readonly termMonths: number
	) {
		super(amount);
		this.ranges = AmortizationCustom.parseIntervalString(input);
	}

	public appliesTo(month: number): boolean {
		if (month > this.termMonths) return false;

		return this.ranges.some(range => month >= range.start && month <= range.end);
	}

	/**
	 * Parses a custom interval string into month ranges.
	 * @param input - Interval string (e.g., "1,3,5" or "1-5,10,15-20")
	 * @returns Array of month ranges
	 * @throws Error if the format is invalid
	 */
	public static parseIntervalString(input: string | undefined): MonthRange[] {
		const trimmed = input?.trim();
		if (!trimmed) {
			throw new Error("Intervalo personalizado é obrigatório para amortizações do tipo 'Outro'");
		}

		const ranges: MonthRange[] = [];
		const parts = trimmed.split(",");

		for (const part of parts) {
			const cleanPart = part.trim();
			if (!cleanPart) continue;

			if (cleanPart.includes("-")) {
				const [startStr, endStr] = cleanPart.split("-");
				const start = Number(startStr);
				const end = Number(endStr);

				if (!Number.isInteger(start) || !Number.isInteger(end) || start <= 0 || end <= 0 || start > end) {
					throw new Error(`Intervalo inválido: "${cleanPart}"`);
				}

				ranges.push({
					start,
					end
				});
			} else {
				const month = Number(cleanPart);
				if (!Number.isInteger(month) || month <= 0) {
					throw new Error(`Mês inválido: "${cleanPart}"`);
				}

				ranges.push({
					start: month,
					end: month
				});
			}
		}

		return ranges;
	}

}