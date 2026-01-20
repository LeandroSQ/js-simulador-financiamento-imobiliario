import { HeaderBackground } from "./header-background";

export interface ConfirmationModalOptions {
	title: string;
	message: string;
	confirmLabel?: string;
	cancelLabel?: string;
	background?: HeaderBackground;
}
