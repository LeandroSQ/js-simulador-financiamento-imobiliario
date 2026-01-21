import { Resultado } from "../types/resultado";

import { PieChart } from "./charts/pie-chart";

// Get monitor pixel ratio
export class ChartsController {

	private chart1: PieChart | null = null;

	public render(resultado: Resultado) {
		this.renderChart1(resultado);
		this.renderChart2(resultado);
	}

	private renderChart1(resultado: Resultado) {
		const { canvas, ctx } = this.setupChart("simulacao-chart1");

		// Pie slice 0 - Valor Financiado
		// Pie slice 1 - Valor Total de Juros
		// Pie slice 2 - Valor Total de Taxas
		const totalFinanciado = resultado.valorFinanciado;
		const totalJuros = resultado.valorTotalJuros;
		const totalTaxas = resultado.custoTotalEfetivo - totalFinanciado - totalJuros;
		const slices = [
			{
				label: "Valor Financiado",
				value: totalFinanciado,
				formattedValue: totalFinanciado.toCurrencyString(),
				color: document.getVar("--bs-primary-rgb")
			},
			{
				label: "Valor Total de Juros",
				value: totalJuros,
				formattedValue: totalJuros.toCurrencyString(),
				color: document.getVar("--bs-warning-rgb")
			},
			{
				label: "Valor Total de Taxas",
				value: totalTaxas,
				formattedValue: totalTaxas.toCurrencyString(),
				color: document.getVar("--bs-danger-rgb")
			}
		];
		// Let's throw an Easter egg here, the colors are actually from the RS flag :)

		if (this.chart1 === null) {
			this.chart1 = new PieChart(canvas, ctx, slices);
		} else {
			this.chart1.entries = slices;
			this.chart1.invalidate();
		}
	}

	private renderChart2(resultado: Resultado) {
		const { canvas, ctx } = this.setupChart("simulacao-chart2");
	}

	private setupChart(id: string): { canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D; } {
		const canvas: HTMLCanvasElement = document.getElementByIdOrThrow(id);
		const ctx = canvas.getContext("2d");
		if (!ctx) throw new Error("Não foi possível obter o contexto do canvas");

		return {
			canvas,
			ctx
		};
	}

	public onColorModeChange() {
		this.chart1?.invalidate();
	}

}

class ChartProfiler {

	private frameStartTime: DOMHighResTimeStamp = 0;
	private lastFrameTime: DOMHighResTimeStamp = 0;

	private frames: number = 0;
	private timer: number = 0;

	startFrame() {
		this.frameStartTime = performance.now();
		if (this.lastFrameTime > 0) {
			const elapsed = this.frameStartTime - this.lastFrameTime;
			this.timer += elapsed;
		}

		this.update();
	}

	endFrame() {
		const frameEndTime = performance.now();
		const elapsed = frameEndTime - this.frameStartTime;
		this.frames++;
		this.timer += elapsed;
		this.update();

		this.lastFrameTime = performance.now();
	}

	update() {
		if (this.timer >= 1000) {
			const fps = this.frames;
			const avgFrameTime = this.timer / this.frames;

			console.log(`FPS: ${fps}, Avg Frame Time: ${avgFrameTime.toFixed(2)} ms`);

			this.frames = 0;
			this.timer = 0;
		}
	}

}
