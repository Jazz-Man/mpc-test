await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "bun",
	minify: false,
	// banner: "#!/usr/bin/env node",
});
