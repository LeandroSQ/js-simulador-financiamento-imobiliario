export type PeriodoAmortizacao = "Anual" | "Mensal" | "Bienal" | "Outro";

export class Amortizacao {

	constructor(
		public meses: number[],
		public valor: number
	) {

	}

	public static parse(periodo: PeriodoAmortizacao, prazoMeses: number, input: string | undefined, valor: number): Amortizacao {
		switch (periodo) {
			case "Anual":
				const mesesAnual: number[] = [];
				for (let i = 12; i <= prazoMeses; i += 12) {
					mesesAnual.push(i);
				}
				return new Amortizacao(mesesAnual, valor);
			case "Mensal":
				const mesesMensal: number[] = [];
				for (let i = 1; i <= prazoMeses; i++) {
					mesesMensal.push(i);
				}
				return new Amortizacao(mesesMensal, valor);
			case "Bienal":
				const mesesBienal: number[] = [];
				for (let i = 24; i <= prazoMeses; i += 24) {
					mesesBienal.push(i);
				}
				return new Amortizacao(mesesBienal, valor);
			case "Outro":
				const trimmed = input?.trim() ?? "";
				if (!trimmed) {
					throw new Error("Intervalo personalizado é obrigatório para amortizações do tipo 'Outro'");
				}

				const meses: number[] = [];
				const parts = trimmed.split(",").map(part => part.trim()).filter(part => part.length > 0);
				for (const part of parts) {
					if (part.includes("-")) {
						const rangeParts = part.split("-").map(rangePart => rangePart.trim());
						if (rangeParts.length !== 2) {
							throw new Error(`Intervalo inválido: ${part}`);
						}

						const start = parseInt(rangeParts[0], 10);
						const end = parseInt(rangeParts[1], 10);
						if (isNaN(start) || isNaN(end) || start <= 0 || end <= 0 || start > end) {
							throw new Error(`Intervalo inválido: ${part}`);
						}

						for (let i = start; i <= end; i++) {
							meses.push(i);
						}
						continue;
					}

					const month = parseInt(part, 10);
					if (isNaN(month) || month <= 0) {
						throw new Error(`Mês inválido: ${part}`);
					}
					meses.push(month);
				}

				return new Amortizacao(meses, valor);
			default:
				throw new Error(`Período de amortização inválido: ${periodo}`);
		}
	}

}