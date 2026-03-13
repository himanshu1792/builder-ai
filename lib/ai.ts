import { createOpenAI } from "@ai-sdk/openai";
import { createAzure } from "@ai-sdk/azure";
import type { LanguageModel } from "ai";

export type AIProvider = "openai" | "azureopenai";

/**
 * Returns the configured AI provider based on the AI_PROVIDER env var.
 * Supports "openai" (direct OpenAI) and "azureopenai" (Azure OpenAI via WSO2).
 */
function getProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "openai";
  if (provider !== "openai" && provider !== "azureopenai") {
    throw new Error(
      `Invalid AI_PROVIDER: "${provider}". Must be "openai" or "azureopenai".`
    );
  }
  return provider;
}

/**
 * Get a chat model instance based on the configured provider.
 * - openai: Uses OPENAI_API_KEY + OPENAI_MODEL
 * - azureopenai: Uses Azure endpoint + WSO2 token auth
 */
export function getChatModel(): LanguageModel {
  const provider = getProvider();

  if (provider === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is required when AI_PROVIDER=openai");

    const openai = createOpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o";
    return openai(model);
  }

  // Azure OpenAI via WSO2 gateway
  const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
  const deployment = process.env.AZURE_OPENAI_CHAT_DEPLOYMENT;
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || "2024-02-15-preview";

  if (!endpoint) throw new Error("AZURE_OPENAI_ENDPOINT is required when AI_PROVIDER=azureopenai");
  if (!deployment) throw new Error("AZURE_OPENAI_CHAT_DEPLOYMENT is required when AI_PROVIDER=azureopenai");

  // Extract base URL from the full endpoint (strip path after /openai)
  const url = new URL(endpoint);
  const baseURL = `${url.protocol}//${url.host}${url.pathname.split("/openai")[0]}`;

  const azure = createAzure({
    baseURL: `${baseURL}/openai/deployments`,
    apiKey: "wso2-managed", // WSO2 handles auth via bearer token
    apiVersion,
  });

  return azure(deployment);
}

/**
 * For WSO2-gated Azure OpenAI, fetch a bearer token using client credentials.
 * Returns the access token string.
 */
export async function getWSO2Token(): Promise<string> {
  const tokenUrl = process.env.WSO2_TOKEN_URL;
  const consumerKey = process.env.WSO2_CONSUMER_KEY;
  const consumerSecret = process.env.WSO2_CONSUMER_SECRET;

  if (!tokenUrl || !consumerKey || !consumerSecret) {
    throw new Error(
      "WSO2_TOKEN_URL, WSO2_CONSUMER_KEY, and WSO2_CONSUMER_SECRET are required for Azure OpenAI via WSO2"
    );
  }

  const credentials = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`WSO2 token request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.access_token;
}

/**
 * Get the current AI provider name for display/logging.
 */
export function getProviderName(): string {
  const provider = getProvider();
  return provider === "openai" ? "OpenAI" : "Azure OpenAI (WSO2)";
}
