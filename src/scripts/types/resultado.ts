import { HistoricoMes } from "./historico-mes";


export type Resultado = {
	valorFinanciado: number;
	valorParcelaInicial: number;
	valorParcelaFinal: number;
	evolucao: HistoricoMes[];
	custoTotalEfetivo: number;
	valorTotalJuros: number;
	valorTotalAmortizado: number;
	seguroMensal: number;
	taxaAdministracaoMensal: number;
};
