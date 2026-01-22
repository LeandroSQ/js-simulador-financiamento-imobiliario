import * as bootstrap from "bootstrap";

/**
 * Controller for displaying simple alert/notification modals.
 * Use for displaying messages, warnings, or errors to the user.
 */
export class AlertModalController {

	private readonly modalElement: HTMLElement;
	private readonly modal: bootstrap.Modal;
	private readonly header: HTMLElement;
	private readonly title: HTMLElement;
	private readonly body: HTMLElement;

	private static readonly BACKGROUND_CLASSES = [
		"bg-danger",
		"bg-warning",
		"bg-success",
		"bg-info",
		"bg-primary"
	] as const;

	constructor(elementId: string = "generic-modal") {
		this.modalElement = document.getElementByIdOrThrow(elementId);
		this.modal = new bootstrap.Modal(this.modalElement);
		this.header = document.getElementByIdOrThrow("generic-modal-header");
		this.title = document.getElementByIdOrThrow("generic-modal-title");
		this.body = document.getElementByIdOrThrow("generic-modal-body");
	}

	/**
	 * Displays an alert modal with the specified content.
	 * @param title - Modal title text
	 * @param message - Modal body message
	 * @param background - Bootstrap background class for the header
	 */
	public show(title: string, message: string, background: string = "bg-primary"): void {
		this.header.classList.remove(...AlertModalController.BACKGROUND_CLASSES);
		this.header.classList.add(background);

		this.title.textContent = title;
		this.body.textContent = message;

		this.modal.show();
	}

}

// Alias for backward compatibility
export { AlertModalController as GenericModalController };
