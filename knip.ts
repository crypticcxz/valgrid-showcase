const config = {
	project: ["client/**/*.{ts,tsx}", "server/**/*.{ts,tsx}", "shared/**/*.ts"],
	ignore: ["scripts/**", "analyzer/**", "templates/**"],
	ignoreDependencies: [
		"tailwindcss",
		"eslint",
		"typescript-eslint",
		"@typescript-eslint/utils",
	],
	rules: {
		files: "error",
		dependencies: "error",
		unlisted: "error",
		binaries: "error",
		unresolved: "error",
		exports: "warn",
		types: "warn",
		enumMembers: "error",
		duplicates: "error",
	},
}

export default config
