import { Correcao } from "./correcao";
import { Tabela } from "./tabela";


export interface ValoresSimulacao {
	valorImovel: number;
	valorEntrada: number;
	taxaJurosAnual: number;
	prazoMeses: number;
	taxaAdministracaoMensal: number;
	seguroMensal: number;
	tabela: Tabela;
	correcao: Correcao;
	projecaoTaxaJuros: number;
}
