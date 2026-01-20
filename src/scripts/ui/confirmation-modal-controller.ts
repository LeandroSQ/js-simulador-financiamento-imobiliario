import * as bootstrap from "bootstrap";

import { ConfirmationModalOptions } from "../types";

const HEADER_BACKGROUND_CLASSES = [
	"bg-danger",
	"bg-warning",
	"bg-success",
	"bg-info",
	"bg-primary"
] as const;

export class ConfirmationModalController {

	private readonly modalElement: HTMLElement;
	private readonly modal: bootstrap.Modal;
	private readonly header: HTMLElement;
	private readonly title: HTMLElement;
	private readonly body: HTMLElement;
	private readonly confirmButton: HTMLButtonElement;
	private readonly cancelButton: HTMLButtonElement;
	private pendingResolve?: (result: boolean) => void;

	constructor() {
		this.modalElement = document.getElementByIdOrThrow("confirmation-modal");
		this.modal = new bootstrap.Modal(this.modalElement);
		this.header = document.getElementByIdOrThrow("confirmation-modal-header");
		this.title = document.getElementByIdOrThrow("confirmation-modal-title");
		this.body = document.getElementByIdOrThrow("confirmation-modal-body");
		this.confirmButton = document.getElementByIdOrThrow<HTMLButtonElement>("confirmation-modal-confirm");
		this.cancelButton = document.getElementByIdOrThrow<HTMLButtonElement>("confirmation-modal-cancel");

		this.modalElement.addEventListener("hidden.bs.modal", () => { this.handleHidden(); });
		this.confirmButton.addEventListener("click", () => { this.finish(true); });
		this.cancelButton.addEventListener("click", event => {
			event.preventDefault();
			this.finish(false);
		});
	}

	public confirm(options: ConfirmationModalOptions): Promise<boolean> {
		const { title, message, confirmLabel = "Confirmar", cancelLabel = "Cancelar", background = "bg-primary" } = options;

		this.header.classList.remove(...HEADER_BACKGROUND_CLASSES);
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

	private finish(result: boolean) {
		if (this.pendingResolve) {
			const resolve = this.pendingResolve;
			this.pendingResolve = undefined;
			resolve(result);
		}

		this.modal.hide();
	}

	private handleHidden() {
		if (this.pendingResolve) {
			const resolve = this.pendingResolve;
			this.pendingResolve = undefined;
			resolve(false);
		}
	}

}
