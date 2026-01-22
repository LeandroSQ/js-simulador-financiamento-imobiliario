import { SimulationResult } from "../types";

import { LineChart, LineSeries } from "./charts/line-chart";
import { PieChart } from "./charts/pie-chart";

/**
 * Controller for rendering simulation result charts.
 * Manages pie chart (cost breakdown) and line chart (payment evolution).
 */
export class ChartsController {

	private costBreakdownChart: PieChart | null = null;
	private paymentEvolutionChart: LineChart | null = null;

	public render(resultado: SimulationResult) {
		this.renderCostBreakdownChart(resultado);
		this.renderPaymentEvolutionChart(resultado);
	}

	private renderCostBreakdownChart(resultado: SimulationResult) {
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

		if (this.costBreakdownChart === null) {
			this.costBreakdownChart = new PieChart(canvas, ctx, slices);
		} else {
			this.costBreakdownChart.entries = slices;
			this.costBreakdownChart.invalidate();
		}
	}

	private renderPaymentEvolutionChart(resultado: SimulationResult) {
		const { canvas, ctx } = this.setupChart("simulacao-chart2");

		// Line chart showing evolution over time
		// Series: Saldo Devedor, Prestação, Amortização, Juros
		const series: LineSeries[] = [
			{
				label: "Saldo Devedor",
				color: document.getVar("--bs-primary-rgb"),
				data: resultado.evolucao.map((mes, index) => ({
					x: index + 1,
					y: mes.saldoDevedor
				}))
			},
			{
				label: "Prestação",
				color: document.getVar("--bs-success-rgb"),
				data: resultado.evolucao.map((mes, index) => ({
					x: index + 1,
					y: mes.valorParcela
				}))
			},
			{
				label: "Amortização",
				color: document.getVar("--bs-info-rgb"),
				data: resultado.evolucao.map((mes, index) => ({
					x: index + 1,
					y: mes.valorAmortizacao
				}))
			},
			{
				label: "Juros",
				color: document.getVar("--bs-warning-rgb"),
				data: resultado.evolucao.map((mes, index) => ({
					x: index + 1,
					y: mes.valorJuros
				}))
			}
		];

		if (this.paymentEvolutionChart === null) {
			this.paymentEvolutionChart = new LineChart(canvas, ctx, series);
		} else {
			this.paymentEvolutionChart.entries = series;
			this.paymentEvolutionChart.layout(); // Line chart needs to recalculate data bounds
			this.paymentEvolutionChart.invalidate();
		}
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
		this.costBreakdownChart?.invalidate();
		this.paymentEvolutionChart?.invalidate();
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
