import { BaseChart } from "./base-chart";

export interface LineDataPointV1 {
	x: number;
	y: number;
}

export interface LineSeriesV1 {
	label: string;
	color: string;
	data: LineDataPointV1[];
}

export class LineChartV1 extends BaseChart<LineSeriesV1> {

	// Layout constants
	private static readonly PADDING_TOP = 20;
	private static readonly PADDING_RIGHT = 20;
	private static readonly PADDING_BOTTOM = 60;
	private static readonly PADDING_LEFT = 80;

	// Chart styling
	private static readonly GRID_LINE_COUNT = 5;
	private static readonly POINT_RADIUS = 4;
	private static readonly HOVER_RADIUS = 6;
	private static readonly FONT_SIZE = 12;
	private static readonly LEGEND_BOX_SIZE = 10;
	private static readonly LEGEND_SPACING = 20;
	private static readonly HOVER_DISTANCE_THRESHOLD = 30;

	private chartArea = {
		x: 0,
		y: 0,
		width: 0,
		height: 0
	};

	private minX = 0;
	private maxX = 0;
	private minY = 0;
	private maxY = 0;

	private hoveredPointIndex = -1;
	private hoveredSeriesIndex = -1;

	constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, entries: LineSeriesV1[]) {
		super(canvas, ctx, entries);
		this.init();

		// Setup animation progress
		this.animationProgress = new Array(this.entries.length).fill(0.0);
	}

	override attachHooks(): void {
		this.canvas.addEventListener("mousemove", this.onMouseMove.bind(this));
		this.canvas.addEventListener("mouseleave", this.onMouseLeave.bind(this));
	}

	private onMouseMove(event: MouseEvent): void {
		const mouseX = event.offsetX;
		const mouseY = event.offsetY;

		// Check if mouse is within chart area
		if (
			mouseX < this.chartArea.x ||
			mouseX > this.chartArea.x + this.chartArea.width ||
			mouseY < this.chartArea.y ||
			mouseY > this.chartArea.y + this.chartArea.height
		) {
			this.clearHover();
			return;
		}

		// Find the closest point
		let closestDistance = Infinity;
		let closestPointIndex = -1;
		let closestSeriesIndex = -1;

		for (let seriesIndex = 0; seriesIndex < this.entries.length; seriesIndex++) {
			const series = this.entries[seriesIndex];
			for (let pointIndex = 0; pointIndex < series.data.length; pointIndex++) {
				const point = series.data[pointIndex];
				const screenX = this.mapXToScreen(point.x);
				const screenY = this.mapYToScreen(point.y);

				const distance = Math.sqrt(
					Math.pow(mouseX - screenX, 2) + Math.pow(mouseY - screenY, 2)
				);

				if (distance < closestDistance && distance < LineChartV1.HOVER_DISTANCE_THRESHOLD) {
					closestDistance = distance;
					closestPointIndex = pointIndex;
					closestSeriesIndex = seriesIndex;
				}
			}
		}

		if (closestPointIndex !== this.hoveredPointIndex || closestSeriesIndex !== this.hoveredSeriesIndex) {
			this.hoveredPointIndex = closestPointIndex;
			this.hoveredSeriesIndex = closestSeriesIndex;

			if (closestSeriesIndex !== -1) {
				this.selectedIndex = closestSeriesIndex;
				this.animationProgress[closestSeriesIndex] = 0.0;
				this.lastAnimationTime = -1;
				this.canvas.style.cursor = "pointer";
			} else {
				this.selectedIndex = -1;
				this.canvas.style.cursor = "default";
			}

			this.invalidate();
		}
	}

	private onMouseLeave(): void {
		this.clearHover();
	}

	private clearHover(): void {
		if (this.hoveredPointIndex !== -1 || this.hoveredSeriesIndex !== -1) {
			this.hoveredPointIndex = -1;
			this.hoveredSeriesIndex = -1;
			this.selectedIndex = -1;
			this.canvas.style.cursor = "default";
			this.invalidate();
		}
	}

	override layout(): void {
		const canvasWidth = this.canvas.width / document.devicePixelRatio;
		const canvasHeight = this.canvas.height / document.devicePixelRatio;

		this.chartArea = {
			x: LineChartV1.PADDING_LEFT,
			y: LineChartV1.PADDING_TOP,
			width: canvasWidth - LineChartV1.PADDING_LEFT - LineChartV1.PADDING_RIGHT,
			height: canvasHeight - LineChartV1.PADDING_TOP - LineChartV1.PADDING_BOTTOM
		};

		this.calculateDataBounds();
	}

	private calculateDataBounds(): void {
		if (this.entries.length === 0) return;

		this.minX = Infinity;
		this.maxX = -Infinity;
		this.minY = 0; // Always start Y at 0 for financial charts
		this.maxY = -Infinity;

		for (const series of this.entries) {
			for (const point of series.data) {
				this.minX = Math.min(this.minX, point.x);
				this.maxX = Math.max(this.maxX, point.x);
				this.maxY = Math.max(this.maxY, point.y);
			}
		}

		// Add some padding to maxY
		this.maxY *= 1.1;
	}

	private mapXToScreen(x: number): number {
		if (this.maxX === this.minX) return this.chartArea.x;
		return this.chartArea.x + ((x - this.minX) / (this.maxX - this.minX)) * this.chartArea.width;
	}

	private mapYToScreen(y: number): number {
		if (this.maxY === this.minY) return this.chartArea.y + this.chartArea.height;
		return this.chartArea.y + this.chartArea.height - ((y - this.minY) / (this.maxY - this.minY)) * this.chartArea.height;
	}

	override render(): void {
		this.renderGrid();
		this.renderAxes();
		this.renderLines();
		this.renderPoints();
		this.renderLegend();
		this.renderTooltip();
	}

	private renderGrid(): void {
		this.ctx.save();
		this.ctx.strokeStyle = document.getVar("--bs-border-color");
		this.ctx.lineWidth = 0.5;
		this.ctx.setLineDash([
			4,
			4
		]);

		// Horizontal grid lines
		for (let i = 0; i <= LineChartV1.GRID_LINE_COUNT; i++) {
			const y = this.chartArea.y + (i / LineChartV1.GRID_LINE_COUNT) * this.chartArea.height;
			this.ctx.beginPath();
			this.ctx.moveTo(this.chartArea.x, y);
			this.ctx.lineTo(this.chartArea.x + this.chartArea.width, y);
			this.ctx.stroke();
		}

		this.ctx.restore();
	}

	private renderAxes(): void {
		this.ctx.save();
		this.ctx.strokeStyle = document.getVar("--bs-body-color");
		this.ctx.fillStyle = document.getVar("--bs-body-color");
		this.ctx.lineWidth = 1;
		this.ctx.font = `${LineChartV1.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.textBaseline = "middle";

		// Y-axis line
		this.ctx.beginPath();
		this.ctx.moveTo(this.chartArea.x, this.chartArea.y);
		this.ctx.lineTo(this.chartArea.x, this.chartArea.y + this.chartArea.height);
		this.ctx.stroke();

		// X-axis line
		this.ctx.beginPath();
		this.ctx.moveTo(this.chartArea.x, this.chartArea.y + this.chartArea.height);
		this.ctx.lineTo(this.chartArea.x + this.chartArea.width, this.chartArea.y + this.chartArea.height);
		this.ctx.stroke();

		// Y-axis labels
		this.ctx.textAlign = "right";
		for (let i = 0; i <= LineChartV1.GRID_LINE_COUNT; i++) {
			const y = this.chartArea.y + (i / LineChartV1.GRID_LINE_COUNT) * this.chartArea.height;
			const value = this.maxY - (i / LineChartV1.GRID_LINE_COUNT) * (this.maxY - this.minY);
			this.ctx.fillText(value.toShortCurrencyString(), this.chartArea.x - 8, y);
		}

		// X-axis labels (show a subset to avoid overcrowding)
		this.ctx.textAlign = "center";
		this.ctx.textBaseline = "top";
		const xLabelCount = Math.min(10, Math.floor(this.maxX - this.minX) + 1);
		const xStep = Math.max(1, Math.floor((this.maxX - this.minX) / (xLabelCount - 1)));

		for (let i = this.minX; i <= this.maxX; i += xStep) {
			const x = this.mapXToScreen(i);
			this.ctx.fillText(`${Math.round(i)}`, x, this.chartArea.y + this.chartArea.height + 8);
		}

		// X-axis title
		this.ctx.fillText(
			"Mês",
			this.chartArea.x + this.chartArea.width / 2,
			this.chartArea.y + this.chartArea.height + 28
		);

		this.ctx.restore();
	}

	private renderLines(): void {
		for (let seriesIndex = 0; seriesIndex < this.entries.length; seriesIndex++) {
			const series = this.entries[seriesIndex];
			if (series.data.length < 2) continue;

			this.ctx.save();
			this.ctx.strokeStyle = series.color;
			this.ctx.lineWidth = this.selectedIndex === seriesIndex ? 3 : 2;
			this.ctx.lineJoin = "round";
			this.ctx.lineCap = "round";

			// Apply alpha if not selected and another series is selected
			if (this.selectedIndex !== -1 && this.selectedIndex !== seriesIndex) {
				this.ctx.globalAlpha = 0.3;
			}

			this.ctx.beginPath();
			const firstPoint = series.data[0];
			this.ctx.moveTo(this.mapXToScreen(firstPoint.x), this.mapYToScreen(firstPoint.y));

			for (let i = 1; i < series.data.length; i++) {
				const point = series.data[i];
				this.ctx.lineTo(this.mapXToScreen(point.x), this.mapYToScreen(point.y));
			}

			this.ctx.stroke();
			this.ctx.restore();
		}
	}

	private renderPoints(): void {
		for (let seriesIndex = 0; seriesIndex < this.entries.length; seriesIndex++) {
			const series = this.entries[seriesIndex];

			// Only render points for hovered series or when zoomed in enough
			const shouldRenderAllPoints = series.data.length <= 24;
			const isHoveredSeries = this.hoveredSeriesIndex === seriesIndex;

			for (let pointIndex = 0; pointIndex < series.data.length; pointIndex++) {
				const point = series.data[pointIndex];
				const isHoveredPoint = isHoveredSeries && this.hoveredPointIndex === pointIndex;

				// Skip non-hovered points if there are too many
				if (!shouldRenderAllPoints && !isHoveredPoint) continue;

				const screenX = this.mapXToScreen(point.x);
				const screenY = this.mapYToScreen(point.y);
				const radius = isHoveredPoint ? LineChartV1.HOVER_RADIUS : LineChartV1.POINT_RADIUS;

				this.ctx.save();

				// Apply alpha if not selected and another series is selected
				if (this.selectedIndex !== -1 && this.selectedIndex !== seriesIndex) {
					this.ctx.globalAlpha = 0.3;
				}

				// Draw point background
				this.ctx.fillStyle = document.getVar("--bs-body-bg");
				this.ctx.beginPath();
				this.ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
				this.ctx.fill();

				// Draw point border
				this.ctx.strokeStyle = series.color;
				this.ctx.lineWidth = isHoveredPoint ? 3 : 2;
				this.ctx.stroke();

				this.ctx.restore();
			}
		}
	}

	private renderLegend(): void {
		this.ctx.save();
		this.ctx.font = `${LineChartV1.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.textBaseline = "middle";

		let legendX = this.chartArea.x;
		const legendY = this.chartArea.y + this.chartArea.height + 45;

		for (let i = 0; i < this.entries.length; i++) {
			const series = this.entries[i];

			// Color box
			this.ctx.fillStyle = series.color;
			this.ctx.fillRect(legendX, legendY - LineChartV1.LEGEND_BOX_SIZE / 2, LineChartV1.LEGEND_BOX_SIZE, LineChartV1.LEGEND_BOX_SIZE);

			// Label
			this.ctx.fillStyle = document.getVar("--bs-body-color");
			if (this.selectedIndex === i) {
				this.ctx.font = `bold ${LineChartV1.FONT_SIZE}px ${this.cachedFontFamily}`;
			} else {
				this.ctx.font = `${LineChartV1.FONT_SIZE}px ${this.cachedFontFamily}`;
			}
			this.ctx.textAlign = "left";
			this.ctx.fillText(series.label, legendX + LineChartV1.LEGEND_BOX_SIZE + 5, legendY);

			const textWidth = this.ctx.measureText(series.label).width;
			legendX += LineChartV1.LEGEND_BOX_SIZE + 5 + textWidth + LineChartV1.LEGEND_SPACING;
		}

		this.ctx.restore();
	}

	private renderTooltip(): void {
		if (this.hoveredSeriesIndex === -1 || this.hoveredPointIndex === -1) return;

		const series = this.entries[this.hoveredSeriesIndex];
		const point = series.data[this.hoveredPointIndex];
		const screenX = this.mapXToScreen(point.x);
		const screenY = this.mapYToScreen(point.y);

		const tooltipText = `${series.label}: ${point.y.toCurrencyString()}`;
		const monthText = `Mês ${Math.round(point.x)}`;

		this.ctx.save();
		this.ctx.font = `${LineChartV1.FONT_SIZE}px ${this.cachedFontFamily}`;

		const tooltipWidth = Math.max(
			this.ctx.measureText(tooltipText).width,
			this.ctx.measureText(monthText).width
		) + 16;
		const tooltipHeight = 40;
		const tooltipPadding = 8;

		// Position tooltip above the point
		let tooltipX = screenX - tooltipWidth / 2;
		let tooltipY = screenY - tooltipHeight - 12;

		// Keep tooltip within bounds
		tooltipX = Math.clamp(tooltipX, this.chartArea.x, this.chartArea.x + this.chartArea.width - tooltipWidth);
		if (tooltipY < this.chartArea.y) {
			tooltipY = screenY + 12;
		}

		// Draw tooltip background with shadow
		this.ctx.shadowColor = "rgba(0,0,0,0.15)";
		this.ctx.shadowBlur = 8;
		this.ctx.shadowOffsetY = 2;
		this.ctx.fillStyle = document.getVar("--bs-body-bg");
		this.ctx.strokeStyle = series.color;
		this.ctx.lineWidth = 2;

		this.ctx.beginPath();
		this.ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 4);
		this.ctx.fill();
		this.ctx.stroke();

		// Reset shadow
		this.ctx.shadowColor = "transparent";
		this.ctx.shadowBlur = 0;
		this.ctx.shadowOffsetY = 0;

		// Draw tooltip text
		this.ctx.textAlign = "left";
		this.ctx.textBaseline = "top";

		this.ctx.fillStyle = document.getVar("--bs-secondary-color");
		this.ctx.fillText(monthText, tooltipX + tooltipPadding, tooltipY + tooltipPadding);

		this.ctx.fillStyle = series.color;
		this.ctx.font = `bold ${LineChartV1.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.fillText(tooltipText, tooltipX + tooltipPadding, tooltipY + tooltipPadding + 16);

		this.ctx.restore();
	}

}