import { BaseChart } from "./base-chart";

export interface LineDataPoint {
	x: number;
	y: number;
}

export interface LineSeries {
	label: string;
	color: string;
	data: LineDataPoint[];
}

export interface Rectangle {
	x: number;
	y: number;
	width: number;
	height: number;
}

interface HoveredPoint {
	seriesIndex: number;
	pointIndex: number;
	x: number;
	y: number;
	dataPoint: LineDataPoint;
}

export class LineChart extends BaseChart<LineSeries> {

	// Layout constants
	private static readonly PADDING_TOP = 20;
	private static readonly PADDING_RIGHT = 20;
	private static readonly PADDING_BOTTOM = 60;

	private static readonly FONT_SIZE = 12;
	private static readonly GRID_LINE_COUNT = 5;

	private static readonly LEGEND_BOX_SIZE = 10;
	private static readonly LEGEND_SPACING = 20;

	private static readonly POINT_HIT_RADIUS = 10;
	private static readonly TOOLTIP_PADDING = 8;

	private paddingLeft: number = 60;

	// Layout bounds
	private bounds: Rectangle = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};

	// Data bounds
	private dataBounds = {
		minX: 0,
		maxX: 0,
		minY: 0,
		maxY: 0
	};

	// Mouse position
	private mouseX: number = -1;
	private mouseY: number = -1;
	private hoveredPoint: HoveredPoint | null = null;

	constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, entries: LineSeries[]) {
		super(canvas, ctx, entries);
		this.init();

		// Setup animation progress
		this.animationProgress = new Array(1).fill(0.0);
	}

	override attachHooks(): void {
		this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
		this.canvas.addEventListener("mouseleave", this.onMouseLeave.bind(this));
	}

	private onMouseMove(event: MouseEvent): void {
		const rect = this.canvas.getBoundingClientRect();
		this.mouseX = event.clientX - rect.left;
		this.mouseY = event.clientY - rect.top;
		this.updateHoveredPoint();
		this.invalidate();
	}

	private onMouseLeave(_event: MouseEvent): void {
		this.mouseX = -1;
		this.mouseY = -1;
		this.hoveredPoint = null;
		this.invalidate();
	}

	private updateHoveredPoint(): void {
		this.hoveredPoint = null;

		if (this.mouseX < 0 || this.mouseY < 0) return;

		let closestDistance = LineChart.POINT_HIT_RADIUS;

		for (let i = 0; i < this.entries.length; i++) {
			const series = this.entries[i];

			for (let j = 0; j < series.data.length; j++) {
				const point = series.data[j];

				// Calculate canvas position
				const normalizedX = (point.x - this.dataBounds.minX) / (this.dataBounds.maxX - this.dataBounds.minX);
				const normalizedY = (point.y - this.dataBounds.minY) / (this.dataBounds.maxY - this.dataBounds.minY);
				const x = this.bounds.x + normalizedX * this.bounds.width;
				const y = this.bounds.y + (1 - normalizedY) * this.bounds.height;

				const distance = Math.sqrt(Math.pow(this.mouseX - x, 2) + Math.pow(this.mouseY - y, 2));

				if (distance < closestDistance) {
					closestDistance = distance;
					this.hoveredPoint = {
						seriesIndex: i,
						pointIndex: j,
						x,
						y,
						dataPoint: point
					};
				}
			}
		}
	}

	override layout(): void {
		const canvasWidth = this.canvas.width / document.devicePixelRatio;
		const canvasHeight = this.canvas.height / document.devicePixelRatio;

		this.calculateDataBounds();

		// Let's calculate the left padding based on the widest Y axis label
		this.ctx.font = `${LineChart.FONT_SIZE}px ${this.cachedFontFamily}`;
		const longestLabelValue = this.dataBounds.maxY;
		const labelText = longestLabelValue.toShortCurrencyString();
		const textWidth = this.ctx.measureText(labelText).width;
		this.paddingLeft = textWidth + LineChart.PADDING_RIGHT;

		this.bounds = {
			x: this.paddingLeft,
			y: LineChart.PADDING_TOP,
			width: canvasWidth - LineChart.PADDING_RIGHT - this.paddingLeft,
			height: canvasHeight - LineChart.PADDING_TOP - LineChart.PADDING_BOTTOM
		};
	}

	private calculateDataBounds(): void {
		if (this.entries.length <= 0) return;

		this.dataBounds.minX = Infinity;
		this.dataBounds.maxX = -Infinity;
		this.dataBounds.minY = 0; // Always start Y at 0 for financial charts
		this.dataBounds.maxY = -Infinity;

		for (const series of this.entries) {
			for (const point of series.data) {
				this.dataBounds.minX = Math.min(this.dataBounds.minX, point.x);
				this.dataBounds.maxX = Math.max(this.dataBounds.maxX, point.x);
				this.dataBounds.maxY = Math.max(this.dataBounds.maxY, point.y);
			}
		}

		// Add some padding to maxY
		this.dataBounds.maxY *= 1.1;
	}

	override render(): void {
		this.renderGrid();
		this.renderAxes();
		this.renderLines();
		this.renderLegend();
		this.renderTooltip();
	}

	private renderGrid(): void {
		this.ctx.save();
		this.ctx.strokeStyle = document.getVar("--bs-border-color");
		this.ctx.lineWidth = 0.5;
		this.ctx.setLineDash([4, 4]);

		// Horizontal grid lines, skipping the first line at Y=0
		for (let i = 0; i <= LineChart.GRID_LINE_COUNT - 1; i++) {
			const y = this.bounds.y + (i / LineChart.GRID_LINE_COUNT) * this.bounds.height;
			this.ctx.beginPath();
			this.ctx.moveTo(this.bounds.x, y);
			this.ctx.lineTo(this.bounds.x + this.bounds.width, y);
			this.ctx.stroke();
		}

		// Vertical grid lines, skipping the first line at X=0
		for (let i = 1; i <= LineChart.GRID_LINE_COUNT; i++) {
			const x = this.bounds.x + (i / LineChart.GRID_LINE_COUNT) * this.bounds.width;
			this.ctx.beginPath();
			this.ctx.moveTo(x, this.bounds.y);
			this.ctx.lineTo(x, this.bounds.y + this.bounds.height);
			this.ctx.stroke();
		}

		this.ctx.restore();
	}

	private renderAxes(): void {
		// Render X and Y axes lines
		this.ctx.save();
		this.ctx.strokeStyle = document.getVar("--bs-border-color");
		this.ctx.fillStyle = document.getVar("--bs-body-color");
		this.ctx.lineWidth = 1;
		this.ctx.font = `${LineChart.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.textBaseline = "middle";

		// X axis
		this.ctx.beginPath();
		this.ctx.moveTo(this.bounds.x, this.bounds.y + this.bounds.height);
		this.ctx.lineTo(this.bounds.x + this.bounds.width, this.bounds.y + this.bounds.height);
		this.ctx.stroke();

		// Y axis
		this.ctx.beginPath();
		this.ctx.moveTo(this.bounds.x, this.bounds.y);
		this.ctx.lineTo(this.bounds.x, this.bounds.y + this.bounds.height);
		this.ctx.stroke();

		// Y axis labels, skipping the first label at Y=0
		for (let i = 0; i <= LineChart.GRID_LINE_COUNT - 1; i++) {
			const value = this.dataBounds.maxY * (1 - i / LineChart.GRID_LINE_COUNT);
			const y = this.bounds.y + (i / LineChart.GRID_LINE_COUNT) * this.bounds.height;

			const labelText = value.toShortCurrencyString();
			const textWidth = this.ctx.measureText(labelText).width;

			this.ctx.fillText(labelText, this.bounds.x - 10 - textWidth, y);
		}

		// X axis labels, skipping the first label at X=0
		for (let i = 1; i <= LineChart.GRID_LINE_COUNT; i++) {
			const value = this.dataBounds.minX + (this.dataBounds.maxX - this.dataBounds.minX) * (i / LineChart.GRID_LINE_COUNT);
			const x = this.bounds.x + (i / LineChart.GRID_LINE_COUNT) * this.bounds.width;

			const labelText = Math.round(value).toString();
			const textWidth = this.ctx.measureText(labelText).width;

			this.ctx.fillText(labelText, x - textWidth / 2, this.bounds.y + this.bounds.height + 10 + LineChart.FONT_SIZE / 2);
		}

		this.ctx.restore();
	}

	private renderLines(): void {
		for (let i = 0; i < this.entries.length; i++) {
			const series = this.entries[i];

			this.ctx.save();
			this.ctx.strokeStyle = series.color;
			this.ctx.lineWidth = 2;
			this.ctx.beginPath();

			for (let j = 0; j < series.data.length; j++) {
				const point = series.data[j];

				// Calculate normalized positions
				const normalizedX = (point.x - this.dataBounds.minX) / (this.dataBounds.maxX - this.dataBounds.minX);
				const normalizedY = (point.y - this.dataBounds.minY) / (this.dataBounds.maxY - this.dataBounds.minY);

				// Calculate canvas positions
				const x = this.bounds.x + normalizedX * this.bounds.width;
				const y = this.bounds.y + (1 - normalizedY) * this.bounds.height;

				if (j === 0) {
					this.ctx.moveTo(x, y);
				} else {
					this.ctx.lineTo(x, y);
				}
			}

			this.ctx.stroke();
			this.ctx.restore();
		}

		// Draw hovered point indicator
		if (this.hoveredPoint) {
			const series = this.entries[this.hoveredPoint.seriesIndex];
			this.ctx.save();
			this.ctx.fillStyle = series.color;
			this.ctx.beginPath();
			this.ctx.arc(this.hoveredPoint.x, this.hoveredPoint.y, 5, 0, Math.PI * 2);
			this.ctx.fill();
			this.ctx.restore();
		}
	}

	private renderTooltip(): void {
		if (!this.hoveredPoint) return;

		const series = this.entries[this.hoveredPoint.seriesIndex];
		const point = this.hoveredPoint.dataPoint;

		this.ctx.save();
		this.ctx.font = `${LineChart.FONT_SIZE}px ${this.cachedFontFamily}`;

		const labelLine = series.label;
		const xLine = `X: ${Math.round(point.x)}`;
		const yLine = `Y: ${point.y.toShortCurrencyString()}`;

		const labelWidth = this.ctx.measureText(labelLine).width;
		const xWidth = this.ctx.measureText(xLine).width;
		const yWidth = this.ctx.measureText(yLine).width;
		const maxWidth = Math.max(labelWidth, xWidth, yWidth);

		const tooltipWidth = maxWidth + LineChart.TOOLTIP_PADDING * 2;
		const tooltipHeight = LineChart.FONT_SIZE * 3 + LineChart.TOOLTIP_PADDING * 2 + 8;

		// Position tooltip to avoid going off screen
		let tooltipX = this.hoveredPoint.x + 10;
		let tooltipY = this.hoveredPoint.y - tooltipHeight - 10;

		const canvasWidth = this.canvas.width / document.devicePixelRatio;

		if (tooltipX + tooltipWidth > canvasWidth - LineChart.PADDING_RIGHT) {
			tooltipX = this.hoveredPoint.x - tooltipWidth - 10;
		}

		if (tooltipY < LineChart.PADDING_TOP) {
			tooltipY = this.hoveredPoint.y + 10;
		}

		// Draw tooltip background
		this.ctx.fillStyle = document.getVar("--bs-body-bg");
		this.ctx.strokeStyle = document.getVar("--bs-border-color");
		this.ctx.lineWidth = 1;
		this.ctx.beginPath();
		this.ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
		this.ctx.fill();
		this.ctx.stroke();

		// Draw tooltip text
		this.ctx.fillStyle = document.getVar("--bs-body-color");
		this.ctx.textBaseline = "top";

		let textY = tooltipY + LineChart.TOOLTIP_PADDING;

		// Series label (bold)
		this.ctx.font = `bold ${LineChart.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.fillStyle = series.color;
		this.ctx.fillText(labelLine, tooltipX + LineChart.TOOLTIP_PADDING, textY);
		textY += LineChart.FONT_SIZE + 4;

		// X value
		this.ctx.font = `${LineChart.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.fillStyle = document.getVar("--bs-body-color");
		this.ctx.fillText(xLine, tooltipX + LineChart.TOOLTIP_PADDING, textY);
		textY += LineChart.FONT_SIZE + 4;

		// Y value
		this.ctx.fillText(yLine, tooltipX + LineChart.TOOLTIP_PADDING, textY);

		this.ctx.restore();
	}

	private renderLegend(): void {
		this.ctx.save();
		this.ctx.font = `${LineChart.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.textBaseline = "middle";

		let legendY = this.bounds.y + this.bounds.height + 45;

		// Calculate total legend width first
		let totalLegendWidth = 0;
		for (let i = 0; i < this.entries.length; i++) {
			const series = this.entries[i];
			const textWidth = this.ctx.measureText(series.label).width;
			totalLegendWidth += LineChart.LEGEND_BOX_SIZE + 5 + textWidth;
			if (i < this.entries.length - 1) {
				totalLegendWidth += LineChart.LEGEND_SPACING;
			}
		}

		// Start from centered position
		let legendX = this.bounds.x + (this.bounds.width - totalLegendWidth) / 2;

		for (let i = 0; i < this.entries.length; i++) {
			const series = this.entries[i];

			this.ctx.save();

			if (this.hoveredPoint && this.hoveredPoint.seriesIndex === i) {
				this.ctx.translate(0, -2);
			}

			// Color box
			this.ctx.fillStyle = series.color;
			this.ctx.fillRect(legendX, legendY - LineChart.LEGEND_BOX_SIZE / 2, LineChart.LEGEND_BOX_SIZE, LineChart.LEGEND_BOX_SIZE);

			// Label
			this.ctx.textAlign = "left";
			this.ctx.font = `${LineChart.FONT_SIZE}px ${this.cachedFontFamily}`;
			this.ctx.fillStyle = document.getVar("--bs-body-color");
			this.ctx.fillText(series.label, legendX + LineChart.LEGEND_BOX_SIZE + 5, legendY);

			// Advance X position
			const textWidth = this.ctx.measureText(series.label).width;
			legendX += LineChart.LEGEND_BOX_SIZE + 5 + textWidth + LineChart.LEGEND_SPACING;

			this.ctx.restore();
		}

		this.ctx.restore();
	}

}