declare module "vanilla-masker" {
	interface MaskMoneyOptions {
		precision: number;
		separator: string;
		delimiter: string;
		zeroCents: boolean;
	}

	type MaskableElements = Element | Element[] | NodeListOf<Element>;

	interface VMaskerInstance {
		maskMoney(options: MaskMoneyOptions): void;
	}

	interface VMaskerStatic {
		(element: MaskableElements): VMaskerInstance;
	}

	const VMasker: VMaskerStatic;
	export default VMasker;
}
