declare global {
	interface Math {
		/** Clamps a number between a minimum and maximum value. */
		clamp(value: number, min: number, max: number): number;
	}
}

export {};

Math.clamp = function (value: number, min: number, max: number): number {
	return Math.min(Math.max(value, min), max);
};