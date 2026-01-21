import { BaseChart } from "./base-chart";

export interface PieSlice {
	label: string;
	value: number;
	color: string;
	formattedValue: string;
}

// Akctually it's a doughnut chart but who really cares
export class PieChart extends BaseChart<PieSlice> {

	private static readonly BOTTOM_MARGIN = 40; // in pixels
	private static readonly PADDING = 40; // in pixels
	private static readonly SELECTED_SLICE_SCALE_MULTIPLIER = 0.1;
	private static readonly FONT_SIZE = 12;
	private static readonly FONT_LINE_HEIGHT = 10;
	private static readonly BIG_FONT_SIZE = 16;
	private cachedFontHeight = -1;

	private center = {
		x: 0,
		y: 0
	};
	private radius: number = 0;

	constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, entries: PieSlice[]) {
		super(canvas, ctx, entries);
		this.init();
	}

	private get legendStartY(): number {
		return this.canvas.height / document.devicePixelRatio - PieChart.BOTTOM_MARGIN - this.cachedFontHeight * this.entries.length;
	}

	override attachHooks() {
		const events = [
			"mousemove",
			"mouseleave",
			"mouseout",
			"mouseover",
			"mouseenter",
			"mousedown",
			"mouseup",
			"mousewheel",
			"dblclick",
			"click"
		];
		for (const event of events) {
			this.canvas.addEventListener(event, this.onMouseEvent.bind(this));
		}
	}

	private onMouseEvent(event: MouseEvent) {
		const mouseX = event.offsetX;
		const mouseY = event.offsetY;

		if (mouseY >= this.center.y + this.radius) {
			const index = Math.floor((mouseY - (this.legendStartY - PieChart.FONT_LINE_HEIGHT)) / (this.cachedFontHeight + PieChart.FONT_LINE_HEIGHT));
			if (index >= 0 && index < this.entries.length) {
				this.canvas.style.cursor = "pointer";
				if (this.selectedIndex !== index) {
					this.selectedIndex = index;
					this.animationProgress[index] = 0.0;
					this.lastAnimationTime = -1; // Clear up the last animation time to avoid large delta
					this.invalidate();
				}
				
				return;
			}
		}

		const dx = mouseX - this.center.x;
		const dy = mouseY - this.center.y;
		const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
		if (distanceFromCenter < this.radius && distanceFromCenter > this.radius * 0.5) {
			this.canvas.style.cursor = "pointer";

			// Map mouse position to an angle in [0, 2π), where 0 starts at the top (-0.5π)
			const twoPi = Math.PI * 2;
			if (this.total <= 0) {
				this.selectedIndex = -1;
				return;
			}

			const angleFromX = (Math.atan2(dy, dx) + twoPi) % twoPi; // 0 at +X axis
			const angle = (angleFromX + Math.PI / 2) % twoPi; // 0 at top (12 o'clock)


			// Determine which slice is hovered using cumulative angles
			let cumulative = 0;
			let hoveredIndex = -1;
			for (let i = 0; i < this.entries.length; i++) {
				const sliceAngle = (this.entries[i].value / this.total) * twoPi;
				cumulative += sliceAngle;

				if (angle < cumulative) {
					hoveredIndex = i;
					break;
				}
			}

			if (hoveredIndex !== this.selectedIndex) {
				this.selectedIndex = hoveredIndex;
				this.animationProgress[hoveredIndex] = 0.0;
				this.lastAnimationTime = -1; // Clear up the last animation time to avoid large delta
				this.invalidate();
			}
		} else {
			this.canvas.style.cursor = "default";
			if (this.selectedIndex !== -1) {
				this.selectedIndex = -1;
				this.lastAnimationTime = -1; // Clear up the last animation time to avoid large delta
				this.invalidate();
			}
		}
	}

	override layout() {
		// Calculate the layout
		this.radius = Math.min(
			this.canvas.width / (2 * document.devicePixelRatio),
			this.canvas.height / (2 * document.devicePixelRatio) - PieChart.BOTTOM_MARGIN
		) - PieChart.PADDING;
		this.center = {
			x: this.canvas.width / (2 * document.devicePixelRatio),
			y: this.radius + PieChart.PADDING
		};
	}

	override render() {
		// Render some shadows 'cos we want people thinking we are mining bitcoin in their browsers :)
		this.renderShadow();
		this.renderChart();
		this.renderLegend();
		this.renderInnerCircle();
	}

	private renderShadow() {
		this.ctx.save();

		this.ctx.shadowColor = "rgba(0,0,0,0.15)";
		this.ctx.shadowBlur = 10;
		this.ctx.shadowOffsetY = 5;

		this.ctx.fillStyle = "white"; // color doesn't matter

		this.ctx.beginPath();
		this.ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
		this.ctx.arc(
			this.center.x,
			this.center.y,
			this.radius * 0.5,
			0,
			Math.PI * 2,
			true
		);
		this.ctx.closePath();
		this.ctx.fill();

		this.ctx.restore();
	}

	private renderChart() {
		// Draw pie slices
		let startAngle = -0.5 * Math.PI;
		for (let i = 0; i < this.entries.length; i++) {
			const slice = this.entries[i];
			const sliceAngle = (slice.value / this.total) * 2 * Math.PI;
			const endAngle = startAngle + sliceAngle;

			const scale = 1.0 + Math.pow(this.animationProgress[i], 2.0) * PieChart.SELECTED_SLICE_SCALE_MULTIPLIER;
			this.ctx.beginPath();

			// Outer arc
			this.ctx.arc(
				this.center.x,
				this.center.y,
				this.radius * scale,
				startAngle,
				endAngle
			);

			// Inner arc
			this.ctx.arc(
				this.center.x,
				this.center.y,
				this.radius * 0.5,
				endAngle,
				startAngle,
				true
			);

			this.ctx.closePath();
			this.ctx.fillStyle = slice.color;
			this.ctx.fill();

			startAngle = endAngle;
		}
	}

	private renderLegend() {
		this.ctx.font = `${PieChart.FONT_SIZE}px ${this.cachedFontFamily}`;
		this.ctx.textBaseline = "middle";

		// Measure text height
		if (this.cachedFontHeight <= 0) {
			const fontMetrics = this.ctx.measureText("M");
			this.cachedFontHeight = fontMetrics.actualBoundingBoxAscent + fontMetrics.actualBoundingBoxDescent;
		}

		const legendX = 10;
		let legendY = this.legendStartY;

		for (let i = 0; i < this.entries.length; i++) {
			const slice = this.entries[i];

			const offsetX = PieChart.PADDING / 4 * this.animationProgress[i];

			// Draw color box
			const boxSize = PieChart.FONT_SIZE / 1.5;
			this.ctx.fillStyle = slice.color;
			this.ctx.fillRect(legendX + offsetX, legendY, boxSize, boxSize);

			// Draw label
			this.ctx.fillStyle = document.getVar("--bs-body-color");

			const labelText = `${slice.label} - `;
			const valueText = slice.formattedValue;
			const x = legendX + boxSize + legendX + offsetX;

			// Label
			this.ctx.font = `${PieChart.FONT_SIZE}px ${this.cachedFontFamily}`;
			this.ctx.fillText(
				labelText,
				x,
				legendY + boxSize / 2
			);

			// Value
			if (this.selectedIndex === i) {
				this.ctx.fillStyle = slice.color;
			}

			const labelWidth = this.ctx.measureText(labelText).width;
			this.ctx.font = `bold ${PieChart.FONT_SIZE}px ${this.cachedFontFamily}`;
			this.ctx.fillText(
				valueText,
				x + labelWidth,
				legendY + boxSize / 2
			);

			legendY += boxSize + PieChart.FONT_LINE_HEIGHT;
		}
	}

	private renderInnerCircle() {
		for (let i = 0; i < this.entries.length; i++) {
			const slice = this.entries[i];
			const progress = Math.pow(this.animationProgress[i], 2.0);
			if (progress <= 0.0) continue;
			const valueText = slice.formattedValue;

			this.ctx.save();
			this.ctx.globalAlpha = progress;
			this.ctx.translate(this.center.x, this.center.y);
			this.ctx.scale(progress, progress);
			this.ctx.translate(0, 20 * (1.0 - progress));
			this.ctx.translate(-this.center.x, -this.center.y);

			// Primary text (value)
			this.ctx.font = `bold ${PieChart.BIG_FONT_SIZE}px ${this.cachedFontFamily}`;
			const textMetrics = this.ctx.measureText(valueText);
			this.ctx.fillStyle = slice.color;
			this.ctx.fillText(
				valueText,
				this.center.x - textMetrics.width / 2,
				this.center.y
			);

			// Secondary text ( % of total )
			const percentage = (slice.value / this.total) * 100;
			const secondaryText = `${percentage.toFixed(2)}%`;
			this.ctx.font = `${PieChart.FONT_SIZE}px ${this.cachedFontFamily}`;
			const secondaryTextMetrics = this.ctx.measureText(secondaryText);
			this.ctx.fillStyle = document.getVar("--bs-body-color");
			this.ctx.fillText(
				secondaryText,
				this.center.x - secondaryTextMetrics.width / 2,
				this.center.y + this.cachedFontHeight * 2
			);

			this.ctx.restore();
		}
	}

}
