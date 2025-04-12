import "./src/index.ts";

await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "node",
	// minify: false,
	banner: "#!/usr/bin/env node",
});
