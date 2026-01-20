import { HistoricoMes } from "./historico-mes";


export interface Resultado {
	valorFinanciado: number;
	valorParcelaInicial: number;
	valorParcelaFinal: number;
	evolucao: HistoricoMes[];
	custoTotalEfetivo: number;
	valorTotalJuros: number;
	valorTotalAmortizado: number;
	seguroMensal: number;
	taxaAdministracaoMensal: number;
}
