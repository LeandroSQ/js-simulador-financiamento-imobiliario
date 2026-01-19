export type ColorMode = "dark" | "light" | null;

export type ColorModeChangeHandler = (mode: ColorMode) => void;

export class ColorModeController {
	private readonly radioGroup: HTMLElement;
	private changeHandler?: ColorModeChangeHandler;
	private currentMode: ColorMode = null;

	constructor(id: string = "color-switch") {
		this.radioGroup = document.getElementByIdOrThrow<HTMLElement>(id);
	}

	public setup() {
		this.restoreStoredMode();
		this.attachListeners();
	}

	public onChange(handler: ColorModeChangeHandler) {
		this.changeHandler = handler;
	}

	public setMode(mode: ColorMode) {
		this.currentMode = mode;
		this.applyMode(mode);
		this.syncRadios(mode);
		if (this.changeHandler) this.changeHandler(mode);
	}

	public getMode(): ColorMode {
		return this.currentMode;
	}

	private attachListeners() {
		const radios = Array.from(this.radioGroup.querySelectorAll("input") as NodeListOf<HTMLInputElement>);
		for (const radio of radios) {
			radio.addEventListener("change", event => {
				const target = event.currentTarget as HTMLInputElement;
				const rawValue = target.value;
				const mode = rawValue === "auto" ? null : (rawValue as ColorMode);
				this.setMode(mode);
			});
		}
	}

	private restoreStoredMode() {
		const stored = localStorage.getItem("color-mode") as ColorMode | null;
		this.setMode(stored ?? null);
	}

	private applyMode(mode: ColorMode) {
		if (mode === "dark" || mode === "light") {
			document.documentElement.setAttribute("data-bs-theme", mode);
			localStorage.setItem("color-mode", mode);
		} else {
			const prefersDarkScheme = window.matchMedia("(prefers-color-scheme: dark)");
			document.documentElement.setAttribute("data-bs-theme", prefersDarkScheme.matches ? "dark" : "light");
			localStorage.removeItem("color-mode");
		}
	}

	private syncRadios(mode: ColorMode) {
		const radios = Array.from(this.radioGroup.querySelectorAll("input") as NodeListOf<HTMLInputElement>);
		for (const radio of radios) {
			radio.checked = radio.value === mode || (mode === null && radio.value === "auto");
		}
	}
}
