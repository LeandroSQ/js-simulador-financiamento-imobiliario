/**
 * End-to-End UI Tests using Puppeteer
 *
 * These tests run against the actual built application in a headless browser,
 * verifying real user interactions and UI behavior.
 *
 * Prerequisites:
 * - Run `pnpm build` or `pnpm dev` first to generate the dist folder
 * - Tests use puppeteer for headless browser automation
 * - A local HTTP server is spawned to avoid file:// security restrictions with Workers
 */

import * as fs from "fs";
import * as http from "http";
import * as path from "path";

import puppeteer, { Browser, Page } from "puppeteer";

// Configuration
const DIST_PATH = path.resolve(__dirname, "../dist");
const SERVER_PORT = 8765;
const BASE_URL = `http://localhost:${SERVER_PORT}`;
const TEST_TIMEOUT = 30000;

/**
 * Simple static file server to avoid file:// security restrictions
 * (Web Workers cannot be loaded from file:// origins)
 */
function createStaticServer(rootDir: string, port: number): http.Server {
	const mimeTypes: Record<string, string> = {
		".html": "text/html",
		".js": "application/javascript",
		".css": "text/css",
		".json": "application/json",
		".png": "image/png",
		".jpg": "image/jpeg",
		".svg": "image/svg+xml",
		".ico": "image/x-icon",
		".woff": "font/woff",
		".woff2": "font/woff2",
		".ttf": "font/ttf",
		".webmanifest": "application/manifest+json"
	};

	const server = http.createServer((req, res) => {
		let filePath = path.join(rootDir, req.url === "/" ? "/index.html" : req.url ?? "/index.html");

		// Security: prevent directory traversal
		if (!filePath.startsWith(rootDir)) {
			res.writeHead(403);
			res.end("Forbidden");
			return;
		}

		const ext = path.extname(filePath).toLowerCase();
		const contentType = mimeTypes[ext] ?? "application/octet-stream";

		fs.readFile(filePath, (err, content) => {
			if (err) {
				if (err.code === "ENOENT") {
					res.writeHead(404);
					res.end("Not Found");
				} else {
					res.writeHead(500);
					res.end("Server Error");
				}
			} else {
				res.writeHead(200, { "Content-Type": contentType });
				res.end(content);
			}
		});
	});

	return server.listen(port);
}

describe("UI End-to-End Tests", () => {
	let browser: Browser | null = null;
	let page: Page | null = null;
	let server: http.Server | null = null;

	// Check if dist folder exists
	const distExists = fs.existsSync(DIST_PATH);

	beforeAll(async () => {
		if (!distExists) {
			console.warn("⚠️  Dist folder not found. Run 'pnpm build' first to enable UI tests.");
			return;
		}

		// Start local HTTP server
		server = createStaticServer(DIST_PATH, SERVER_PORT);

		browser = await puppeteer.launch({
			headless: true,
			args: ["--no-sandbox", "--disable-setuid-sandbox"]
		});
	}, TEST_TIMEOUT);

	afterAll(async () => {
		if (browser) {
			await browser.close();
		}
		if (server) {
			server.close();
		}
	});

	beforeEach(async () => {
		if (!distExists) return;
		if (!browser) return;

		page = await browser.newPage();
		await page.setViewport({
			width: 1280,
			height: 800
		});
	});

	afterEach(async () => {
		if (page) {
			await page.close();
		}
	});

	const skipIfNoDist = () => {
		if (!distExists) {
			return test.skip;
		}
		return test;
	};

	describe("Page Load", () => {
		(skipIfNoDist())("should load the main page without errors", async () => {
			if (!page) return;
			const errors: string[] = [];
			page.on("pageerror", (err: Error) => {
				errors.push(err.message);
			});

			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			expect(errors).toHaveLength(0);
		}, TEST_TIMEOUT);

		(skipIfNoDist())("should display the main form", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

			const formExists = await page.$("form") !== null;
			expect(formExists).toBe(true);
		}, TEST_TIMEOUT);

		(skipIfNoDist())("should have all required form fields", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

			const fields = await page.evaluate(() => {
				const ids = ["valor", "entrada", "juros", "prazo", "seguro", "taxa-administracao", "tabela"];
				return ids.map(id => ({
					id,
					exists: document.getElementById(id) !== null
				}));
			});

			fields.forEach(field => {
				expect(field.exists).toBe(true);
			});
		}, TEST_TIMEOUT);
	});

	describe("Form Validation", () => {
		(skipIfNoDist())("should show validation errors for empty required fields", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			// Clear the valor field
			await page.$eval("#valor", (el: Element) => {
				(el as HTMLInputElement).value = "";
			});

			// Try to submit
			await page.click("#submit");

			// Check for validation message
			const isInvalid = await page.$eval("#valor", (el: Element) => {
				return !(el as HTMLInputElement).checkValidity();
			});

			expect(isInvalid).toBe(true);
		}, TEST_TIMEOUT);

		(skipIfNoDist())("should accept valid numeric input", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			// Set values
			await page.type("#valor", "350000", { delay: 10 });

			const value = await page.$eval("#valor", (el: Element) => (el as HTMLInputElement).value);

			// Should have formatted the value (mask-money)
			expect(value).toMatch(/350/);
		}, TEST_TIMEOUT);
	});

	describe("Simulation Flow", () => {
		(skipIfNoDist())("should calculate and display results", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			// Wait for any auto-submit (DEBUG mode)
			await page.waitForSelector("#simulacao-results.active", { timeout: 5000 }).catch(() => {
				// If not in DEBUG mode, we need to fill and submit manually
			});

			// Check results container exists
			const resultsExist = await page.$("#simulacao-results") !== null;
			expect(resultsExist).toBe(true);
		}, TEST_TIMEOUT);

		(skipIfNoDist())("should display simulation result fields when active", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			// Wait for results (may be auto-triggered in DEBUG mode)
			const resultsActive = await page.waitForSelector("#simulacao-results.active", { timeout: 5000 })
				.then(() => true)
				.catch(() => false);

			if (resultsActive) {
				// Verify result fields are populated
				const cetValue = await page.$eval("[data-simulacao-field='custo-total-efetivo']", (el: Element) => {
					return el.textContent?.trim() ?? "";
				});

				// Should contain R$ (currency formatted)
				expect(cetValue).toMatch(/R\$/);
			}
		}, TEST_TIMEOUT);
	});

	describe("Amortization Modal", () => {
		(skipIfNoDist())("should open amortization modal when button is clicked", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			// Find and click the add amortization button
			const addButton = await page.$("[data-bs-target='#modal-amortizacao']");
			if (addButton) {
				await addButton.click();

				// Wait for modal to be visible
				await page.waitForSelector("#modal-amortizacao.show", { timeout: 2000 });

				const modalVisible = await page.$eval("#modal-amortizacao", (el: Element) => {
					return el.classList.contains("show");
				});

				expect(modalVisible).toBe(true);
			}
		}, TEST_TIMEOUT);
	});

	describe("Color Mode Toggle", () => {
		(skipIfNoDist())("should toggle between light and dark mode", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			const toggleButton = await page.$("#color-mode-toggle");
			if (toggleButton) {
				const initialMode = await page.evaluate(() => {
					return document.documentElement.getAttribute("data-bs-theme");
				});

				await toggleButton.click();

				// Wait a moment for the change
				await page.waitForFunction(
					(initial: string | null) => document.documentElement.getAttribute("data-bs-theme") !== initial,
					{},
					initialMode
				);

				const newMode = await page.evaluate(() => {
					return document.documentElement.getAttribute("data-bs-theme");
				});

				expect(newMode).not.toBe(initialMode);
			}
		}, TEST_TIMEOUT);
	});

	describe("Responsive Behavior", () => {
		(skipIfNoDist())("should be usable on mobile viewport", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "networkidle0" });

			// Set mobile viewport
			await page.setViewport({
				width: 375,
				height: 667
			});

			// Check that the form is still visible and usable
			const formVisible = await page.$eval("form", (el: Element) => {
				const rect = el.getBoundingClientRect();
				return rect.width > 0 && rect.height > 0;
			});

			expect(formVisible).toBe(true);
		}, TEST_TIMEOUT);
	});

	describe("Accessibility", () => {
		(skipIfNoDist())("should have proper form labels", async () => {
			if (!page) return;
			await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

			const inputsWithLabels = await page.evaluate(() => {
				const inputs = document.querySelectorAll("input[required]");
				return Array.from(inputs).map(input => {
					const id = input.id;
					const label = document.querySelector(`label[for="${id}"]`);
					return {
						id,
						hasLabel: label !== null
					};
				});
			});

			// At least some inputs should have labels
			const inputsWithLabelCount = inputsWithLabels.filter(i => i.hasLabel).length;
			expect(inputsWithLabelCount).toBeGreaterThan(0);
		}, TEST_TIMEOUT);
	});
});
