/**
 * Extract unique placeholder names from text using {placeholder} syntax.
 */
export function extractPlaceholders(text: string): string[] {
  const regex = /\{(\w+)\}/g;
  const names = new Set<string>();
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text)) !== null) {
    names.add(match[1]);
  }
  return Array.from(names);
}

/**
 * Extract placeholders from combined system + task prompts.
 */
export function extractAllPlaceholders(systemPrompt: string, taskPrompt: string): string[] {
  const combined = `${systemPrompt}\n${taskPrompt}`;
  return extractPlaceholders(combined);
}

/**
 * Replace each {key} in text with the corresponding value from the values map.
 */
export function replacePlaceholders(text: string, values: Record<string, unknown>): string {
  return text.replace(/\{(\w+)\}/g, (fullMatch, key: string) => {
    if (key in values) {
      return String(values[key]);
    }
    return fullMatch;
  });
}

/**
 * Validate that all required placeholders are present in the provided payload.
 */
export function validatePlaceholders(
  required: string[],
  provided: Record<string, unknown>
): { valid: boolean; missing: string[] } {
  const missing = required.filter((key) => !(key in provided));
  return { valid: missing.length === 0, missing };
}
