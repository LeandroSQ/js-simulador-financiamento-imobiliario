# Brazilian Housing Finance Simulator

No-framework TypeScript web app to simulate Brazilian housing financing, focused on transparency and clear amortization schedules.

- English: this file
- Português: see [README.pt.md](README.pt.md)

<center>
    <p float="left" align="center">
		<img src=".github/screenshots/screenshot01.png" style="width: 48%"/>
        <img src=".github/screenshots/screenshot02.png" style="width: 48%"/>
    </p>
</center>

<p align="center">
	<a href="https://leandrosq.github.io/js-simulador-financiamento-imobiliario/">Live demo</a>
</p>

## About

This simulator generates a month-by-month amortization schedule so you can see how each payment splits into principal and interest, and how extraordinary payments reduce total cost and duration.

During development, calculations were validated against real examples to keep results consistent with real-world expectations.

Current scope: fixed-rate simulations using SAC.

I initially did this for personal use, but then it grew into a fun challenge to build a small web app the spartan way, ended up doing a automated mockup tool just for the screenshots above. But it can be useful for others too, so here it is.

## Features

- [x] SAC (Sistema de Amortização Constante / Constant Amortization)
- [x] Fixed interest rate
- [x] Extraordinary payments (monthly, annual, semiannual, and custom)
- [x] Input validation
- [x] Responsive design
- [x] Light and dark mode
- [x] Unit tests
- [ ] PRICE (French amortization)
- [ ] Variable interest rate
- [x] Charts
- [ ] Export to PDF/CSV

## Tech stack

- TypeScript
- Web Worker for heavy calculations
- EJS templates
- SCSS + Bootstrap
- Gulp + esbuild
- Jest

## Getting started

### Requirements

- Node.js (recent LTS)
- pnpm (recommended) or npm

### Install

`pnpm install`

### Run locally

- Dev (watch + BrowserSync): `pnpm dev`
- Prod-like local run: `pnpm start`

Then open `http://localhost:3000`.

### Build

`pnpm build`

Build output goes to `dist/`.

### Lint

`pnpm lint`

### Tests

`pnpm test`

## Project structure (high level)

- `src/scripts/core/` financing logic
- `src/scripts/services/` rate providers (e.g. SELIC, TR)
- `src/scripts/worker/` worker entry + bindings
- `src/views/` EJS templates
- `src/styles/` SCSS
- `tests/` Jest unit tests

## Contributing

Issues and PRs are welcome, especially for PRICE amortization, variable-rate models, charts, and export.

## License

MIT. See [LICENSE](LICENSE).
