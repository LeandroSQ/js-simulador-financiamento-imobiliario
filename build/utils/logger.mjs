import chalk from "chalk";

/**
 * Simple logging utility with timestamp prefix.
 * @module utils/logger
 */


function timestamp() {
	const time = new Date().toTimeString().slice(0, 8);
	return '[' + chalk.magenta(time) + ']';
}

/**
 * Log a message with a timestamp prefix.
 * @param {string} message - Message to log
 */
export function log(message) {
	console.log(`${timestamp()} ${chalk.cyan(message)}`);
}

/**
 * Log a warning message with a timestamp prefix.
 * @param {string} message - Warning message to log
 */
export function warn(message) {
	console.warn(`${timestamp()} ${chalk.yellow("[WARN]")} ${chalk.yellow(message)}`);
}

/**
 * Log an error message with a timestamp prefix.
 * @param {string} message - Error message to log
 */
export function error(message) {
	console.error(`${timestamp()} ${chalk.red("[ERROR]")} ${chalk.red(message)}`);
}
