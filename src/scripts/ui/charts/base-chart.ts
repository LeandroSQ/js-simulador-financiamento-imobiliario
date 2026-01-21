export abstract class BaseChart<T extends { value: number }> {

	protected static readonly ANIMATION_SPEED = 10.0;
	protected static readonly ANIMATION_DECAY_MULTIPLIER = 0.25;
	protected cachedFontFamily: string = "sans-serif";

	// Stores animation progress for each slice (0.0 to 1.0)
	protected animationProgress: number[];

	protected selectedIndex: number = -1;

	// Animation control
	protected lastAnimationTime: DOMHighResTimeStamp = -1;
	private animationFrameRequestId: number | null = null;

	constructor(
		protected canvas: HTMLCanvasElement,
		protected ctx: CanvasRenderingContext2D,
		public entries: T[]
	) {
		// Setup animation progress
		this.animationProgress = new Array(this.entries.length).fill(0.0);
	}

	protected init(): void {
		this.setup();
		this.attachHooks();
		this.layout();
		this.invalidate();
	}

	protected get total(): number {
		return this.entries.reduce((sum, entry) => sum + entry.value, 0);
	}

	protected setup(): void {
		this.setupAntialias();

		// Cache font family
		this.cachedFontFamily = getComputedStyle(document.body).fontFamily || "sans-serif";

		this.setupCanvasScaling();

		this.setupResizeHook();
	}

	private setupCanvasScaling(): void {
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

	private setupAntialias(): void {
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
	}

	private setupResizeHook(): void {
		window.addEventListener("resize", () => {
			console.log("Resizing chart canvas");
			this.setup();
			this.layout();
			this.invalidate();
		});
	}

	public invalidate(): void {
		if (this.animationFrameRequestId !== null) cancelAnimationFrame(this.animationFrameRequestId);
		this.animationFrameRequestId = requestAnimationFrame(this.onFrameRender.bind(this));
	}

	private updateAnimation(now: DOMHighResTimeStamp): boolean {
		// Calculate delta time for animation
		if (this.lastAnimationTime < 0) this.lastAnimationTime = now;
		const deltaTime = (now - this.lastAnimationTime) / 1000.0; // in seconds
		this.lastAnimationTime = now;

		let isDirty = false;

		// Update animation progress for selected slice
		if (this.selectedIndex !== -1) {
			this.animationProgress[this.selectedIndex] += deltaTime * BaseChart.ANIMATION_SPEED;
			if (this.animationProgress[this.selectedIndex] >= 1.0) {
				this.animationProgress[this.selectedIndex] = 1.0;
			} else isDirty = true;
		}

		// Decay animation progress for non-selected slices
		for (let i = 0; i < this.entries.length; i++) {
			if (i !== this.selectedIndex && this.animationProgress[i] > 0.0) {
				this.animationProgress[i] -= deltaTime * BaseChart.ANIMATION_SPEED * BaseChart.ANIMATION_DECAY_MULTIPLIER;
				if (this.animationProgress[i] < 0.0) {
					this.animationProgress[i] = 0.0;
				} else isDirty = true;
			}
		}

		return isDirty;
	}

	private onFrameRender(timestamp: DOMHighResTimeStamp): void {
		const isDirty = this.updateAnimation(timestamp);

		this.ctx.clearRect(0, 0, this.canvas.width / document.devicePixelRatio, this.canvas.height / document.devicePixelRatio);
		this.render();

		if (isDirty) this.invalidate();
	}

	abstract layout(): void;
	abstract attachHooks(): void;
	abstract render(): void;

}