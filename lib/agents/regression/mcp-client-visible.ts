import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";

/**
 * Playwright MCP client with visible (headless:false) browser.
 * Used by the Planner agent so the user can see browser exploration.
 * NOT a singleton — each regression run gets its own browser instance.
 */
export async function createVisiblePlaywrightMCP(): Promise<MCPClient> {
  const client = await createMCPClient({
    transport: new Experimental_StdioMCPTransport({
      command: "node",
      args: [
        "node_modules/@playwright/mcp/cli.js",
        "--browser=chromium",
      ],
    }),
  });
  return client;
}
