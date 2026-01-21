/**
 * Browser frame mockup generator for screenshots.
 * Creates Safari-style window chrome with traffic lights, shadows, and rounded corners.
 * @module browser-frame
 */

import sharp from "sharp";
import { isColorDark, getContrastRatio } from "./utils/color.mjs";
import { log, warn } from "./utils/logger.mjs";

/**
 * Frame theme mode options.
 * @typedef {'light' | 'dark' | 'website' | 'auto'} FrameThemeMode
 * - 'light': Always use Safari light mode frame
 * - 'dark': Always use Safari dark mode frame
 * - 'website': Use the website's theme-color meta tag for the title bar
 * - 'auto': Match frame to website's color scheme
 */

/**
 * Theme colors configuration.
 * @typedef {Object} ThemeColors
 * @property {string} titleBar - Title bar background color
 * @property {string} border - Window border color
 */

/**
 * Frame configuration for the browser mockup.
 * @typedef {Object} FrameConfig
 * @property {number} titleBarHeight - Height of the title bar in pixels
 * @property {number} cornerRadius - Corner radius of the window
 * @property {{ top: number, horizontal: number, bottom: number }} padding - Padding around the window
 * @property {{ outer: number, rimLight: number, rimLightOpacity: number }} border - Border configuration
 * @property {Object} trafficLights - Traffic light button configuration
 * @property {{ blur: number, offsetY: number, opacity: number }} shadow - Drop shadow configuration
 * @property {{ light: ThemeColors, dark: ThemeColors }} colors - Theme color presets
 */

/** @type {FrameConfig} */
const DEFAULT_CONFIG = {
	titleBarHeight: 119,
	cornerRadius: 20,
	padding: { top: 40, horizontal: 80, bottom: 120 },
	border: { outer: 1, rimLight: 2, rimLightOpacity: 0.2 },
	trafficLights: {
		diameter: 27,
		spacing: 16,
		offsetTop: 57,
		offsetLeft: 58,
		colors: {
			close: "#ff5f57",
			minimize: "#febc2e",
			maximize: "#28c840",
		},
		strokeOpacity: 0.2,
	},
	shadow: { blur: 55, offsetY: 35, opacity: 0.45 },
	colors: {
		light: { titleBar: "#f6f6f6", border: "#c0c0c0" },
		dark: { titleBar: "#3c3c3c", border: "#000000" },
	},
};

const MIN_CONTRAST_RATIO = 3.0;

/**
 * Check traffic light contrast against title bar and warn if insufficient.
 * @param {string} titleBarColor - Title bar background color
 */
function checkTrafficLightContrast(titleBarColor) {
	const { colors } = DEFAULT_CONFIG.trafficLights;
	const dots = [
		{ name: "close (red)", color: colors.close },
		{ name: "minimize (yellow)", color: colors.minimize },
		{ name: "maximize (green)", color: colors.maximize },
	];

	const warnings = dots
		.map((dot) => ({ ...dot, ratio: getContrastRatio(dot.color, titleBarColor) }))
		.filter(({ ratio }) => ratio < MIN_CONTRAST_RATIO);

	if (warnings.length > 0) {
		warn(`Low contrast between traffic lights and title bar (${titleBarColor}):`);
		warnings.forEach(({ name, ratio }) =>
			log(`    - ${name}: ${ratio.toFixed(2)}:1 (minimum: ${MIN_CONTRAST_RATIO}:1)`)
		);
		log(`    Safari may adjust dot colors or add borders for better visibility.`);
	}
}

/**
 * Determine frame theme based on mode and website colors.
 * @param {FrameThemeMode} mode - Theme mode
 * @param {string | null} themeColor - Website's theme-color meta tag value
 * @param {boolean} isDarkMode - Whether the website is in dark mode
 * @returns {ThemeColors}
 */
export function getFrameTheme(mode, themeColor, isDarkMode) {
	const { colors } = DEFAULT_CONFIG;

	switch (mode) {
		case "light":
			return colors.light;
		case "dark":
			return colors.dark;
		case "website":
			if (themeColor) {
				checkTrafficLightContrast(themeColor);
				return {
					titleBar: themeColor,
					border: isColorDark(themeColor) ? "#000000" : "#c0c0c0",
				};
			}
			return isDarkMode ? colors.dark : colors.light;
		case "auto":
		default:
			return isDarkMode ? colors.dark : colors.light;
	}
}

/**
 * Generate SVG markup for the browser frame.
 * @param {number} contentWidth - Width of the content area
 * @param {number} contentHeight - Height of the content area
 * @param {ThemeColors} theme - Theme colors to use
 * @returns {string} SVG markup
 */
function createFrameSvg(contentWidth, contentHeight, theme) {
	const { titleBarHeight, cornerRadius, padding, border, trafficLights, shadow } = DEFAULT_CONFIG;
	const totalBorder = border.outer + border.rimLight;

	const windowWidth = contentWidth + totalBorder * 2;
	const windowHeight = titleBarHeight + contentHeight + totalBorder;
	const canvasWidth = windowWidth + padding.horizontal * 2;
	const canvasHeight = windowHeight + padding.top + padding.bottom;

	const windowX = padding.horizontal;
	const windowY = padding.top;

	const dotR = trafficLights.diameter / 2;
	const dotCenterY = windowY + trafficLights.offsetTop;
	const dotCenterX1 = windowX + trafficLights.offsetLeft;
	const dotCenterX2 = dotCenterX1 + trafficLights.diameter + trafficLights.spacing;
	const dotCenterX3 = dotCenterX2 + trafficLights.diameter + trafficLights.spacing;

	const innerRadius = Math.max(0, cornerRadius - totalBorder);
	const outerRadius = Math.max(0, cornerRadius - border.outer);

	const trafficLightSvg = [
		{ cx: dotCenterX1, color: trafficLights.colors.close },
		{ cx: dotCenterX2, color: trafficLights.colors.minimize },
		{ cx: dotCenterX3, color: trafficLights.colors.maximize },
	]
		.map(
			({ cx, color }) => `
    <circle cx="${cx}" cy="${dotCenterY}" r="${dotR}" fill="${color}"/>
    <circle cx="${cx}" cy="${dotCenterY}" r="${dotR}" fill="none" stroke="rgba(0,0,0,${trafficLights.strokeOpacity})" stroke-width="1"/>`
		)
		.join("");

	return `
<svg width="${canvasWidth}" height="${canvasHeight}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="windowShadow" x="-100%" y="-100%" width="300%" height="300%">
      <feDropShadow dx="0" dy="${shadow.offsetY}" stdDeviation="${shadow.blur}" flood-color="black" flood-opacity="${shadow.opacity}"/>
    </filter>
  </defs>
  <rect x="${windowX}" y="${windowY}" width="${windowWidth}" height="${windowHeight}" rx="${cornerRadius}" fill="${theme.border}" filter="url(#windowShadow)"/>
  <rect x="${windowX + border.outer}" y="${windowY + border.outer}" width="${windowWidth - border.outer * 2}" height="${windowHeight - border.outer * 2}" rx="${outerRadius}" fill="rgba(255,255,255,${border.rimLightOpacity})"/>
  <rect x="${windowX + totalBorder}" y="${windowY + totalBorder}" width="${windowWidth - totalBorder * 2}" height="${titleBarHeight - totalBorder}" rx="${innerRadius}" fill="${theme.titleBar}"/>
  <rect x="${windowX + totalBorder}" y="${windowY + titleBarHeight - innerRadius}" width="${windowWidth - totalBorder * 2}" height="${innerRadius}" fill="${theme.titleBar}"/>
  <g>${trafficLightSvg}
  </g>
</svg>`.trim();
}

/**
 * Create a rounded corner mask SVG for the screenshot content.
 * @param {number} width - Content width
 * @param {number} height - Content height
 * @param {number} radius - Corner radius
 * @returns {Buffer} SVG buffer
 */
function createRoundedMask(width, height, radius) {
	return Buffer.from(`
<svg width="${width}" height="${height}">
  <rect x="0" y="0" width="${width}" height="${height}" rx="${radius}" ry="${radius}" fill="white"/>
  <rect x="0" y="0" width="${width}" height="${radius}" fill="white"/>
</svg>`);
}

/**
 * Apply a Safari-style browser frame to a screenshot.
 * @param {string} screenshotPath - Path to the screenshot file (will be overwritten)
 * @param {ThemeColors} theme - Theme colors for the frame
 * @returns {Promise<void>}
 */
export async function applyBrowserFrame(screenshotPath, theme) {
	const { titleBarHeight, cornerRadius, padding, border } = DEFAULT_CONFIG;
	const totalBorder = border.outer + border.rimLight;

	const screenshot = sharp(screenshotPath);
	const { width, height } = await screenshot.metadata();

	if (!width || !height) {
		throw new Error(`Could not read screenshot dimensions: ${screenshotPath}`);
	}

	const frameSvg = createFrameSvg(width, height, theme);
	const innerRadius = Math.max(0, cornerRadius - totalBorder);

	const roundedMask = createRoundedMask(width, height, innerRadius);
	const roundedScreenshot = await screenshot
		.composite([{ input: roundedMask, blend: "dest-in" }])
		.png()
		.toBuffer();

	const canvasWidth = width + totalBorder * 2 + padding.horizontal * 2;
	const canvasHeight = titleBarHeight + height + totalBorder + padding.top + padding.bottom;
	const contentX = padding.horizontal + totalBorder;
	const contentY = padding.top + titleBarHeight;

	await sharp({
		create: {
			width: canvasWidth,
			height: canvasHeight,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	})
		.composite([
			{ input: Buffer.from(frameSvg), left: 0, top: 0 },
			{ input: roundedScreenshot, left: contentX, top: contentY },
		])
		.png()
		.toFile(screenshotPath);
}
