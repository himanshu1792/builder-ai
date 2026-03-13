import { createMCPClient, type MCPClient } from "@ai-sdk/mcp";
import { Experimental_StdioMCPTransport } from "@ai-sdk/mcp/mcp-stdio";

/**
 * Persistent Playwright MCP client singleton.
 * Lazy-initialized on first use; reused across pipeline runs.
 * Spawns @playwright/mcp as a child process via stdio transport.
 */

let client: MCPClient | null = null;
let initPromise: Promise<MCPClient> | null = null;

async function createClient(): Promise<MCPClient> {
  // Use node to run the locally-installed @playwright/mcp directly.
  // Avoids Windows npx spawn issues (ENOENT / EINVAL).
  const newClient = await createMCPClient({
    transport: new Experimental_StdioMCPTransport({
      command: "node",
      args: [
        "node_modules/@playwright/mcp/cli.js",
        "--browser=chromium",
        "--caps=testing",
      ],
    }),
  });
  return newClient;
}

/**
 * Get the persistent Playwright MCP client.
 * Creates it on first call; subsequent calls return the same instance.
 * Thread-safe: concurrent calls during initialization share the same promise.
 */
export async function getPlaywrightMCP(): Promise<MCPClient> {
  if (client) return client;

  // Prevent duplicate initialization from concurrent calls
  if (!initPromise) {
    initPromise = createClient().then((c) => {
      client = c;
      initPromise = null;
      return c;
    }).catch((err) => {
      initPromise = null;
      throw err;
    });
  }

  return initPromise;
}

/**
 * Close the MCP client and release resources.
 * Called during graceful shutdown if needed.
 */
export async function closePlaywrightMCP(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
  }
}
