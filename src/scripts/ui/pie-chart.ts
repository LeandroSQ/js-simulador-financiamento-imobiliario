export interface PieSlice {
	label: string;
	value: number;
	color: string;
	formattedValue: string;
}

// Akctually it's a doughnut chart but who really cares
export class PieChart {

	private static readonly ANIMATION_SPEED = 10.0;
	private static readonly ANIMATION_DECAY_MULTIPLIER = 0.25;
	private static readonly BOTTOM_MARGIN = 40; // in pixels
	private static readonly PADDING = 40; // in pixels
	private static readonly SELECTED_SLICE_SCALE_MULTIPLIER = 0.1;

	private center = {
		x: 0,
		y: 0
	};
	private radius: number = 0;

	private selectedSliceIndex: number = -1;

	// Stores animation progress for each slice (0.0 to 1.0)
	private animationProgress: number[];

	private cachedFontFamily: string = "sans-serif"; // Just so we don't recalc it every frame

	private lastAnimationTime: DOMHighResTimeStamp = -1;

	private animationFrameRequestId: number | null = null;

	constructor(
		private canvas: HTMLCanvasElement,
		private ctx: CanvasRenderingContext2D,
		private slices: PieSlice[]
	) {
		// Setup animation progress
		this.animationProgress = new Array(this.slices.length).fill(0.0);

		this.setup();
		this.layout();
		this.attachHooks();
		this.invalidate();
	}

	private get total(): number {
		return this.slices.reduce((sum, slice) => sum + slice.value, 0);
	}

	private attachHooks() {
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
		window.addEventListener("resize", () => {
			console.log("Resizing chart canvas");
			this.setup();
			this.layout();
			this.invalidate();
		});
	}

	private invalidate() {
		if (this.animationFrameRequestId !== null) {
			cancelAnimationFrame(this.animationFrameRequestId);
		}
		this.animationFrameRequestId = requestAnimationFrame(this.render.bind(this));
	}

	private onMouseEvent(event: MouseEvent) {
		const mouseX = event.offsetX;
		const mouseY = event.offsetY;

		const dx = mouseX - this.center.x;
		const dy = mouseY - this.center.y;
		const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
		if (distanceFromCenter < this.radius && distanceFromCenter > this.radius * 0.5) {
			this.canvas.style.cursor = "pointer";

			// Map mouse position to an angle in [0, 2π), where 0 starts at the top (-0.5π)
			const twoPi = Math.PI * 2;
			if (this.total <= 0) {
				this.selectedSliceIndex = -1;
				return;
			}

			const angleFromX = (Math.atan2(dy, dx) + twoPi) % twoPi; // 0 at +X axis
			const angle = (angleFromX + Math.PI / 2) % twoPi; // 0 at top (12 o'clock)


			// Determine which slice is hovered using cumulative angles
			let cumulative = 0;
			let hoveredIndex = -1;
			for (let i = 0; i < this.slices.length; i++) {
				const sliceAngle = (this.slices[i].value / this.total) * twoPi;
				cumulative += sliceAngle;

				if (angle < cumulative) {
					hoveredIndex = i;
					break;
				}
			}

			if (hoveredIndex !== this.selectedSliceIndex) {
				this.selectedSliceIndex = hoveredIndex;
				this.animationProgress[hoveredIndex] = 0.0;
				this.lastAnimationTime = -1;
				this.invalidate();
			}
		} else {
			this.canvas.style.cursor = "default";
			if (this.selectedSliceIndex !== -1) {
				this.selectedSliceIndex = -1;
				this.lastAnimationTime = -1;
				this.invalidate();
			}
		}
	}

	public layout() {
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

	private setup() {
		// Setup multi-browser anti-aliasing
		const anyCtx = this.ctx as unknown as {
			imageSmoothingEnabled?: boolean;
			imageSmoothingQuality?: ImageSmoothingQuality;
			mozImageSmoothingEnabled?: boolean;
			webkitImageSmoothingEnabled?: boolean;
			msImageSmoothingEnabled?: boolean;
		};

		anyCtx.imageSmoothingEnabled = true;
		anyCtx.mozImageSmoothingEnabled = true;
		anyCtx.webkitImageSmoothingEnabled = true;
		anyCtx.msImageSmoothingEnabled = true;

		if ("imageSmoothingQuality" in anyCtx) {
			anyCtx.imageSmoothingQuality = "high";
		}

		// Cache font family
		this.cachedFontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";

		// Set canvas size
		const parentElement = this.canvas.parentElement;
		if (!parentElement) throw new Error("Canvas não possui elemento pai");

		// Get parent size
		const parentBounds = parentElement.getBoundingClientRect();
		const parentComputedStyle = getComputedStyle(parentElement);
		const parentPaddingX = parseFloat(parentComputedStyle.paddingLeft) + parseFloat(parentComputedStyle.paddingRight);
		const parentWidth = parentBounds.width - parentPaddingX;

		const canvasFixedHeight = Math.max(parentWidth, 250);

		// Set canvas width and height considering device pixel ratio
		this.canvas.width = parentWidth * document.devicePixelRatio;
		this.canvas.height = canvasFixedHeight * document.devicePixelRatio;

		// Set canvas CSS size
		this.canvas.style.width = `${parentWidth}px`;
		this.canvas.style.height = `${canvasFixedHeight}px`;

		// Scale context to account for device pixel ratio (reset first to avoid accumulating scale)
		this.ctx.setTransform(1, 0, 0, 1, 0, 0);
		this.ctx.scale(document.devicePixelRatio, document.devicePixelRatio);
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

	private updateAnimation() {
		// Calculate delta time for animation
		const now = performance.now();
		if (this.lastAnimationTime < 0) this.lastAnimationTime = now;
		const deltaTime = (now - this.lastAnimationTime) / 1000.0; // in seconds
		this.lastAnimationTime = now;

		let isDirty = false;

		// Update animation progress for selected slice
		if (this.selectedSliceIndex !== -1) {
			this.animationProgress[this.selectedSliceIndex] += deltaTime * PieChart.ANIMATION_SPEED;
			if (this.animationProgress[this.selectedSliceIndex] >= 1.0) {
				this.animationProgress[this.selectedSliceIndex] = 1.0;
			} else isDirty = true;
		}

		// Decay animation progress for non-selected slices
		for (let i = 0; i < this.slices.length; i++) {
			if (i !== this.selectedSliceIndex && this.animationProgress[i] > 0.0) {
				this.animationProgress[i] -= deltaTime * PieChart.ANIMATION_SPEED * PieChart.ANIMATION_DECAY_MULTIPLIER;
				if (this.animationProgress[i] < 0.0) {
					this.animationProgress[i] = 0.0;
				} else isDirty = true;
			}
		}

		if (isDirty) {
			this.invalidate();
		}
	}

	public render() {
		// Clear canvas (use CSS pixel units; context is scaled by document.devicePixelRatio)
		this.ctx.clearRect(0, 0, this.canvas.width / document.devicePixelRatio, this.canvas.height / document.devicePixelRatio);

		this.updateAnimation();

		// Render some shadows 'cos we want people thinking we are mining bitcoin in their browsers :)
		this.renderShadow();

		// Draw pie slices
		let startAngle = -0.5 * Math.PI;
		for (let i = 0; i < this.slices.length; i++) {
			const slice = this.slices[i];
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

		this.renderLegend();
	}

	private renderLegend() {
		const fontSize = 12;
		this.ctx.font = `${fontSize}px ${this.cachedFontFamily}`;
		this.ctx.textBaseline = "middle";

		// Measure text height
		const fontMetrics = this.ctx.measureText("M");
		const fontHeight = fontMetrics.actualBoundingBoxAscent + fontMetrics.actualBoundingBoxDescent;

		const legendX = 10;
		let legendY = this.canvas.height / document.devicePixelRatio - PieChart.BOTTOM_MARGIN - fontHeight * this.slices.length;


		for (let i = 0; i < this.slices.length; i++) {
			const slice = this.slices[i];

			const offsetX = PieChart.PADDING / 4 * this.animationProgress[i];

			// Draw color box
			const boxSize = fontSize;
			this.ctx.fillStyle = slice.color;
			this.ctx.fillRect(legendX + offsetX, legendY, boxSize, boxSize);

			// Draw label
			this.ctx.fillStyle = document.getVar("--bs-body-color");

			const labelText = `${slice.label} - `;
			const valueText = slice.formattedValue;
			const x = legendX + boxSize + 10 + offsetX;

			// Label
			this.ctx.font = `${fontSize}px ${this.cachedFontFamily}`;
			this.ctx.fillText(
				labelText,
				x,
				legendY + boxSize / 2
			);

			// Value
			if (this.selectedSliceIndex === i) {
				this.ctx.fillStyle = slice.color;
			}

			const labelWidth = this.ctx.measureText(labelText).width;
			this.ctx.font = `bold ${fontSize}px ${this.cachedFontFamily}`;
			this.ctx.fillText(
				valueText,
				x + labelWidth,
				legendY + boxSize / 2
			);

			legendY += boxSize + 10;
		}

		// Draw on the center the value of the selected slice
		for (let i = 0; i < this.slices.length; i++) {
			const slice = this.slices[i];
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
			this.ctx.font = `bold 16px ${this.cachedFontFamily}`;
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
			this.ctx.font = `12px ${this.cachedFontFamily}`;
			const secondaryTextMetrics = this.ctx.measureText(secondaryText);
			this.ctx.fillStyle = document.getVar("--bs-body-color");
			this.ctx.fillText(
				secondaryText,
				this.center.x - secondaryTextMetrics.width / 2,
				this.center.y + fontHeight * 2
			);

			this.ctx.restore();
		}
	}
}
