/**
 * Screenshot capture orchestration using Puppeteer.
 * Captures light/dark mode screenshots and applies browser frames.
 * @module screenshots
 */

import browserSync from "browser-sync";
import puppeteer from "puppeteer";
import { mkdir } from "node:fs/promises";
import { getFrameTheme, applyBrowserFrame } from "./browser-frame.mjs";
import { log } from "./utils/logger.mjs";

/**
 * Frame theme mode for screenshot generation.
 * @type {import('./browser-frame.mjs').FrameThemeMode}
 */
const FRAME_THEME = "auto";

/** @type {Object} Screenshot configuration */
const config = {
	server: { baseDir: "./dist", port: 3000 },
	screenshot: {
		url: "http://localhost:3000",
		viewport: { width: 1440, height: 900, deviceScaleFactor: 2 },
		outputDir: "./.github/screenshots",
		files: { light: "screenshot01.png", dark: "screenshot02.png" },
	},
	captureDelay: 300,
};

/**
 * Start a local BrowserSync server.
 * @returns {Promise<browserSync.BrowserSyncInstance>}
 */
async function startServer() {
	const server = browserSync.create();
	return new Promise((resolve, reject) => {
		server.init(
			{ open: false, ui: false, notify: false, server: config.server },
			(err) => (err ? reject(err) : resolve(server))
		);
	});
}

/**
 * Extract the theme-color meta tag value from a page.
 * @param {puppeteer.Page} page - Puppeteer page instance
 * @returns {Promise<string | null>}
 */
async function extractThemeColor(page) {
	return page.evaluate(() => {
		const meta = document.querySelector('meta[name="theme-color"]');
		return meta ? meta.getAttribute("content") : null;
	});
}

/**
 * Capture a screenshot with a specific color scheme.
 * @param {puppeteer.Page} page - Puppeteer page instance
 * @param {'light' | 'dark'} colorScheme - Color scheme to emulate
 * @param {string} outputPath - Path to save the screenshot
 * @param {boolean} isReload - Whether to reload instead of navigate
 * @returns {Promise<string | null>} Theme color from the page
 */
async function captureScreenshot(page, colorScheme, outputPath, isReload = false) {
	log(`Capturing ${colorScheme} mode`);

	await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: colorScheme }]);

	if (isReload) {
		await page.reload({ waitUntil: "networkidle0" });
	} else {
		await page.goto(config.screenshot.url, { waitUntil: "networkidle0" });
	}

	await new Promise((resolve) => setTimeout(resolve, config.captureDelay));

	const themeColor = await extractThemeColor(page);
	if (themeColor) log(`Found theme-color: ${themeColor}`);

	await page.screenshot({ path: outputPath, fullPage: true });

	return themeColor;
}

/**
 * Process a screenshot by applying a browser frame.
 * @param {string} screenshotPath - Path to the screenshot
 * @param {string | null} themeColor - Theme color from the page
 * @param {boolean} isDarkMode - Whether the screenshot is in dark mode
 */
async function processScreenshot(screenshotPath, themeColor, isDarkMode) {
	log("Applying frame");
	const theme = getFrameTheme(FRAME_THEME, themeColor, isDarkMode);
	await applyBrowserFrame(screenshotPath, theme);
}

/**
 * Take screenshots of the website in both light and dark modes.
 * Applies Safari-style browser frames to the captured images.
 * @returns {Promise<void>}
 */
export async function takeScreenshots() {
	let server;
	let browser;

	try {
		log("Starting screenshot capture");
		await mkdir(config.screenshot.outputDir, { recursive: true });

		log("Starting local server");
		server = await startServer();

		log("Launching browser");
		browser = await puppeteer.launch({ headless: true });
		const page = await browser.newPage();
		await page.setViewport(config.screenshot.viewport);

		// Light mode
		const lightPath = `${config.screenshot.outputDir}/${config.screenshot.files.light}`;
		const lightThemeColor = await captureScreenshot(page, "light", lightPath);
		await processScreenshot(lightPath, lightThemeColor, false);

		// Dark mode
		const darkPath = `${config.screenshot.outputDir}/${config.screenshot.files.dark}`;
		const darkThemeColor = await captureScreenshot(page, "dark", darkPath, true);
		await processScreenshot(darkPath, darkThemeColor, true);

		log("Screenshots completed");
	} finally {
		if (browser) await browser.close();
		if (server) server.exit();
	}
}
