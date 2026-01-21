/**
 * Color utility functions for parsing, luminance calculation, and contrast analysis.
 * @module utils/color
 */

/**
 * RGB color representation.
 * @typedef {Object} RGB
 * @property {number} r - Red component (0-255)
 * @property {number} g - Green component (0-255)
 * @property {number} b - Blue component (0-255)
 */

/**
 * Parse a color string (hex or rgb) to RGB values.
 * @param {string} color - Color string like "#ff0000", "#f00", or "rgb(255, 0, 0)"
 * @returns {RGB | null} RGB object or null if parsing fails
 */
export function parseColor(color) {
	if (!color) return null;

	// 6-digit hex: #ff0000 or ff0000
	const hexMatch = color.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
	if (hexMatch) {
		return {
			r: parseInt(hexMatch[1], 16),
			g: parseInt(hexMatch[2], 16),
			b: parseInt(hexMatch[3], 16),
		};
	}

	// 3-digit hex: #f00 or f00
	const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
	if (shortHexMatch) {
		return {
			r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
			g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
			b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
		};
	}

	// rgb/rgba: rgb(255, 0, 0) or rgba(255, 0, 0, 0.5)
	const rgbMatch = color.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i);
	if (rgbMatch) {
		return {
			r: parseInt(rgbMatch[1], 10),
			g: parseInt(rgbMatch[2], 10),
			b: parseInt(rgbMatch[3], 10),
		};
	}

	return null;
}

/**
 * Calculate relative luminance of a color (WCAG 2.1 formula).
 * @param {RGB} rgb - RGB color object
 * @returns {number} Luminance value between 0 (black) and 1 (white)
 * @see https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getLuminance({ r, g, b }) {
	const [rs, gs, bs] = [r, g, b].map((c) => {
		c = c / 255;
		return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
	});
	return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

/**
 * Determine if a color is "dark" (would need light text for readability).
 * @param {string} color - Color string
 * @returns {boolean} True if the color is dark
 */
export function isColorDark(color) {
	const rgb = parseColor(color);
	if (!rgb) return false;
	return getLuminance(rgb) < 0.5;
}

/**
 * Calculate contrast ratio between two colors (WCAG 2.1 formula).
 * @param {string} color1 - First color string
 * @param {string} color2 - Second color string
 * @returns {number} Contrast ratio between 1 (identical) and 21 (black/white)
 * @see https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1, color2) {
	const rgb1 = parseColor(color1);
	const rgb2 = parseColor(color2);
	if (!rgb1 || !rgb2) return 1;

	const l1 = getLuminance(rgb1);
	const l2 = getLuminance(rgb2);
	const lighter = Math.max(l1, l2);
	const darker = Math.min(l1, l2);
	return (lighter + 0.05) / (darker + 0.05);
}
