import * as bootstrap from "bootstrap";

import { ConfirmationModalOptions, ModalBackground } from "../types";

const BACKGROUND_CLASSES: readonly ModalBackground[] = [
	"bg-danger",
	"bg-warning",
	"bg-success",
	"bg-info",
	"bg-primary"
] as const;

/**
 * Controller for displaying confirmation dialogs that require user action.
 * Returns a Promise that resolves to true (confirmed) or false (cancelled/dismissed).
 */
export class ConfirmationModalController {

	private readonly modalElement: HTMLElement;
	private readonly modal: bootstrap.Modal;
	private readonly header: HTMLElement;
	private readonly title: HTMLElement;
	private readonly body: HTMLElement;
	private readonly confirmButton: HTMLButtonElement;
	private readonly cancelButton: HTMLButtonElement;
	private pendingResolve?: (result: boolean) => void;

	constructor(elementId: string = "confirmation-modal") {
		this.modalElement = document.getElementByIdOrThrow(elementId);
		this.modal = new bootstrap.Modal(this.modalElement);
		this.header = document.getElementByIdOrThrow("confirmation-modal-header");
		this.title = document.getElementByIdOrThrow("confirmation-modal-title");
		this.body = document.getElementByIdOrThrow("confirmation-modal-body");
		this.confirmButton = document.getElementByIdOrThrow<HTMLButtonElement>("confirmation-modal-confirm");
		this.cancelButton = document.getElementByIdOrThrow<HTMLButtonElement>("confirmation-modal-cancel");

		this.attachEventListeners();
	}

	private attachEventListeners(): void {
		this.modalElement.addEventListener("hidden.bs.modal", () => { this.handleDismissed(); });
		this.confirmButton.addEventListener("click", () => { this.resolveAndClose(true); });
		this.cancelButton.addEventListener("click", event => {
			event.preventDefault();
			this.resolveAndClose(false);
		});
	}

	/**
	 * Displays a confirmation dialog and waits for user response.
	 * @param options - Configuration for the modal content and appearance
	 * @returns Promise that resolves to true if confirmed, false if cancelled
	 */
	public confirm(options: ConfirmationModalOptions): Promise<boolean> {
		const {
			title,
			message,
			confirmLabel = "Confirmar",
			cancelLabel = "Cancelar",
			background = "bg-primary"
		} = options;

		this.header.classList.remove(...BACKGROUND_CLASSES);
		this.header.classList.add(background);

		this.title.textContent = title;
		this.body.textContent = message;
		this.confirmButton.textContent = confirmLabel;
		this.cancelButton.textContent = cancelLabel;

		this.modal.show();

		return new Promise<boolean>(resolve => {
			this.pendingResolve = resolve;
		});
	}

	private resolveAndClose(result: boolean): void {
		if (this.pendingResolve) {
			const resolve = this.pendingResolve;
			this.pendingResolve = undefined;
			resolve(result);
		}

		this.modal.hide();
	}

	private handleDismissed(): void {
		if (this.pendingResolve) {
			const resolve = this.pendingResolve;
			this.pendingResolve = undefined;
			resolve(false);
		}
	}

}
