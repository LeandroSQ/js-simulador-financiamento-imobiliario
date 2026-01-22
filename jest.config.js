/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
	preset: "ts-jest",
	testEnvironment: "node",
	clearMocks: true,
	collectCoverage: true,
	coverageDirectory: "coverage",
	coverageProvider: "v8",
	testTimeout: 10000,
	forceExit: true,
	detectOpenHandles: true,
	verbose: true,
	globals: { DEBUG: true },
	transform: {
		"^.+\\.ts$": [
			"ts-jest",
			{
				isolatedModules: true
			}
		]
	}
};
