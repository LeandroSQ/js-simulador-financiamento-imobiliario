declare global {
	interface FunctionConstructor {

		/** Creates a function that can only be executed once. Subsequent calls have no effect. */
		oneshot<T extends (...args: unknown[]) => unknown>(predicate: T): T;

		/** Creates a debounced function that delays invoking the predicate until after amount milliseconds have elapsed since the last time the debounced function was invoked. */
		debounce<T extends (...args: unknown[]) => unknown>(predicate: T, amount: number): T;
	}
}

export {};

Function.oneshot = function <T extends (...args: unknown[]) => unknown>(predicate: T): T {
	let fired = false;

	const wrapper = ((...args: Parameters<T>) => {
		if (fired) return;
		fired = true;
		predicate(...args);
	}) as T;

	return wrapper;
};

Function.debounce = function <T extends (...args: unknown[]) => unknown>(predicate: T, amount: number): T {
	let timeout: ReturnType<typeof setTimeout> | undefined;

	const wrapper = ((...args: Parameters<T>) => {
		if (timeout) {
			clearTimeout(timeout);
		}
		timeout = setTimeout(() => predicate(...args), amount);
	}) as T;

	return wrapper;
};