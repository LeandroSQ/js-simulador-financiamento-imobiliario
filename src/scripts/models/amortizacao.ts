export type PeriodoAmortizacao = "Anual" | "Mensal" | "Bienal" | "Outro";

export abstract class Amortizacao {

	constructor(public readonly valor: number) {}

	public abstract readonly type: PeriodoAmortizacao;

	public abstract appliesTo(mes: number): boolean;

	public static create(periodo: PeriodoAmortizacao, prazoMeses: number, input: string | undefined, valor: number): Amortizacao {
		switch (periodo) {
			case "Mensal":
				return new AmortizacaoMensal(valor);
			case "Anual":
				return new AmortizacaoAnual(valor);
			case "Bienal":
				return new AmortizacaoBienal(valor);
			case "Outro":
				return new AmortizacaoCustom(valor, input, prazoMeses);
			default:
				const exhaustiveCheck: never = periodo;
				throw new Error(`Período de amortização inválido: ${exhaustiveCheck}`);
		}
	}

	public static fromJSON(json: any): Amortizacao {
		return Amortizacao.create(json.type, json.prazoMeses ?? 0, json.input, json.valor);
	}

	public static validateCustomInterval(input: string | undefined): void {
		AmortizacaoCustom.parse(input);
	}

}

class AmortizacaoMensal extends Amortizacao {

	public readonly type = "Mensal";
	public appliesTo(): boolean {
		return true;
	}

}

class AmortizacaoAnual extends Amortizacao {

	public readonly type = "Anual";
	public appliesTo(mes: number): boolean {
		return mes % 12 === 0;
	}

}

class AmortizacaoBienal extends Amortizacao {

	public readonly type = "Bienal";
	public appliesTo(mes: number): boolean {
		return mes % 24 === 0;
	}

}

export class AmortizacaoCustom extends Amortizacao {

	public readonly type = "Outro";
	private readonly ranges: { start: number; end: number }[];

	constructor(valor: number, public readonly input: string | undefined, public readonly prazoMeses: number) {
		super(valor);
		this.ranges = AmortizacaoCustom.parse(input);
	}

	public appliesTo(mes: number): boolean {
		if (mes > this.prazoMeses) return false;

		for (const range of this.ranges) {
			if (mes >= range.start && mes <= range.end) {
				return true;
			}
		}

		return false;
	}

	public static parse(input: string | undefined): { start: number; end: number }[] {
		const trimmed = input?.trim();
		if (!trimmed) {
			throw new Error("Intervalo personalizado é obrigatório para amortizações do tipo 'Outro'");
		}

		const ranges: { start: number; end: number }[] = [];
		const parts = trimmed.split(",");

		for (const part of parts) {
			const cleanPart = part.trim();
			if (!cleanPart) continue;

			if (cleanPart.includes("-")) {
				const [
					startStr,
					endStr
				] = cleanPart.split("-");
				const start = Number(startStr);
				const end = Number(endStr);

				// Basic validation: positive integers, start <= end
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

				// Unify singles as ranges [x, x]
				ranges.push({
					start: month,
					end: month
				});
			}
		}

		return ranges;
	}

}