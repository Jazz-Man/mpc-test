import {
	McpServer,
	ResourceTemplate,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

async function main() {
	const transport = new StdioServerTransport();

	// Create an MCP server
	const mcpServer = new McpServer(
		{
			name: "Demo",
			version: "1.0.0",
		},
		{
			capabilities: {
				prompts: {
					listChanged: true,
				},
				resources: { subscribe: true, listChanged: true },
				tools: { listChanged: true },
				// logging: {},
				completions: {},
			},
		},
	);

	// Add an addition tool
	mcpServer.tool("add", { a: z.number(), b: z.number() }, async ({ a, b }) => ({
		content: [{ type: "text", text: String(a + b) }],
	}));

	// Add a dynamic greeting resource
	mcpServer.resource(
		"greeting",
		new ResourceTemplate("greeting://{name}", { list: undefined }),
		async (uri, { name }) => ({
			contents: [
				{
					uri: uri.href,
					text: `Hello, ${name}!`,
				},
			],
		}),
	);

	mcpServer.tool(
		"longRunningOperation",
		"Demonstrates a long running operation with progress updates",
		{
			duration: z
				.number()
				.default(10)
				.describe("Duration of the operation in seconds"),
			steps: z.number().default(5).describe("Number of steps in the operation"),
		},
		async ({ duration, steps }, extra) => {
			const stepDuration = duration / steps;

			console.log(extra);

			for (let i = 1; i < steps + 1; i++) {
				await new Promise((resolve) =>
					setTimeout(resolve, stepDuration * 1000),
				);

				await mcpServer.server.sendLoggingMessage({
					level: "info",
					data: `step ${i}`,
				});
			}

			return {
				content: [
					{
						type: "text",
						text: `Long running operation completed. Duration: ${duration} seconds, Steps: ${steps}.`,
					},
				],
			};
		},
	);

	mcpServer.prompt("simple_prompt", "A prompt without arguments", async () => {
		return {
			messages: [
				{
					role: "user",
					content: {
						type: "text",
						text: "This is a simple prompt without arguments TEST.",
					},
				},
			],
		};
	});

	mcpServer.prompt(
		"code_review",
		"Asks the LLM to analyze code quality and suggest improvements",
		{
			code: z.string().describe("The code to review"),
		},
		async ({ code }) => {
			return {
				messages: [
					{
						role: "user",
						content: {
							type: "text",
							text: `Please review this code:\n\n${code}`,
						},
					},
				],
			};
		},
	);

	await mcpServer.connect(transport);

	// Cleanup on exit
	process.on("SIGINT", async () => {
		await mcpServer.close();
		process.exit(0);
	});
}

main().catch((error) => {
	console.error("Server error TEST:", error);
	process.exit(1);
});
