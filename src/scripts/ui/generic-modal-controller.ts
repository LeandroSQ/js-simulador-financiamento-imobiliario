import * as bootstrap from "bootstrap";

export class GenericModalController {

	private readonly modalElement: HTMLElement;
	private readonly modal: bootstrap.Modal;
	private readonly header: HTMLElement;
	private readonly title: HTMLElement;
	private readonly body: HTMLElement;

	constructor() {
		this.modalElement = document.getElementByIdOrThrow("generic-modal");
		this.modal = new bootstrap.Modal(this.modalElement);
		this.header = document.getElementByIdOrThrow("generic-modal-header");
		this.title = document.getElementByIdOrThrow("generic-modal-title");
		this.body = document.getElementByIdOrThrow("generic-modal-body");
	}

	public show(title: string, message: string, background: string = "bg-primary") {
		this.header.classList.remove("bg-danger", "bg-warning", "bg-success", "bg-info", "bg-primary");
		this.header.classList.add(background);

		this.title.textContent = title;
		this.body.textContent = message;

		this.modal.show();
	}

}
