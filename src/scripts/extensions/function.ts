Function.oneshot = function (predicate) {
	let fired = false;

	const wrapper = () => {
		if (fired) return;
		fired = true;

		predicate();
	};

	return wrapper;
};

Function.debounce = function (predicate, amount) {
	let fired = false;

	const wrapper = () => {
		if (fired) return;
		fired = true;

		setTimeout(() => {
			predicate();
			fired = false;
		}, amount);
	};

	return wrapper;
};