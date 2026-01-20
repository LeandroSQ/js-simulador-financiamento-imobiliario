/* eslint-env node */
import gulp from "gulp";
const { src, dest, series, parallel, watch, symlink } = gulp;
import browserSync from "browser-sync";
import htmlMinify from "gulp-htmlmin";
import sourcemaps from "gulp-sourcemaps";
import * as dartSass from "sass";
import gulpSass from "gulp-sass";
const sass = gulpSass(dartSass);
import cssAutoPrefixer from "gulp-autoprefixer";
import concat from "gulp-concat";
import { deleteAsync } from "del";
import { buildPipe as gulpEsbuild } from "./build/esbuild.mjs";
import { isArgumentPassed } from "./build/utils/argparser.mjs";
import ejs from "gulp-ejs";
import rename from "gulp-rename";

// Env
const isProduction = isArgumentPassed("production", "prod");
console.log(isProduction ? "PRODUCTION" : "DEVELOPMENT");

// Options
const browserSyncOptions = {
	open: false,
	browser: false,
	ui: false,
	notify: false,
	host: "0.0.0.0",
	server: {
		baseDir: "./dist",
		port: 3000,
	},
};

const htmlOptions = {
	collapseWhitespace: true,
	removeComments: true,
	removeRedundantAttributes: true,
};

const cssOptions = {
	outputStyle: "compressed",
	sourceComments: false,
	sourceMap: false,
};

// Tasks
function reloadBrowsers() {
	return browserSync.reload({ stream: true });
}

async function cleanDistDir() {
	await deleteAsync("./dist");
}

function initializeBrowserSync() {
	return browserSync.init(browserSyncOptions);
}

function handleHtml() {
	return src(["src/**/*.ejs", "!src/views/**/_*.ejs"])
		.pipe(ejs({}).on('error', (err) => {
			console.error(err);
			this.emit('end');
		}))
		.pipe(htmlMinify(htmlOptions))
		.pipe(rename({ extname: ".html" })) // Correctly rename to .html
		.pipe(dest("./dist")) // Removed non-standard 'ext' option
		.pipe(reloadBrowsers());
}

function watchHtml() {
	return watch("src/**/*.ejs", handleHtml);
}

function handleTs() {
	return src(["src/scripts/main.ts", "src/scripts/worker/worker.ts"])
		.pipe(gulpEsbuild())
		.pipe(dest("./dist/scripts"))
		.pipe(reloadBrowsers());
}

function watchTs() {
	return watch("src/scripts/**/*.ts", handleTs);
}

function handleBootstrapIcons() {
	if (isProduction) {
		return src("node_modules/line-awesome/dist/line-awesome/fonts/**/*.*")
			.pipe(dest("./dist/assets/fonts"))
	} else {
		return src("node_modules/line-awesome/dist/line-awesome/fonts/**/*.*")
			.pipe(symlink("./dist/assets/fonts", { force: true }))
	}
}

function handleAssets() {
	if (isProduction) {
		return src("src/assets/**/**.*")
			.pipe(dest("./dist/assets"))
			.pipe(reloadBrowsers());
	} else {
		return src("src/assets/**/**.*")
			.pipe(symlink("./dist/assets", { force: true }));
	}
}

function handleSCSS() {
	return src("src/styles/**.scss")
		.pipe(sourcemaps.init())
		.pipe(sass(cssOptions).on("error", sass.logError))
		.pipe(cssAutoPrefixer())
		.pipe(concat("main.css"))
		.pipe(sourcemaps.write("./"))
		.pipe(dest("./dist/styles"))
		.pipe(reloadBrowsers());
}

function watchSCSS() {
	return watch("src/styles/**.scss", handleSCSS);
}

// Export tasks
export const assets = parallel(handleAssets, handleBootstrapIcons);
export const html = handleHtml;
export const ts = handleTs;
export const scss = handleSCSS;
export const clean = cleanDistDir;
export const build = series(clean, parallel(assets, scss, html, ts));
export const dev = series(clean,
	parallel(
		initializeBrowserSync,
		build,
		parallel(watchSCSS, watchHtml, watchTs)
	)
);
export default build;