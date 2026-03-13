export interface InputMapping {
  type: 'pick' | 'rename' | 'wrap';
  fields?: string[];
  mapping?: Record<string, string>;
  key?: string;
}

export function applyInputMapping(
  output: Record<string, unknown>,
  mapping: InputMapping | null | undefined
): Record<string, unknown> {
  if (!mapping) {
    return output;
  }

  switch (mapping.type) {
    case 'pick': {
      if (!mapping.fields || mapping.fields.length === 0) return output;
      const picked: Record<string, unknown> = {};
      for (const field of mapping.fields) {
        if (field in output) {
          picked[field] = output[field];
        }
      }
      return picked;
    }

    case 'rename': {
      if (!mapping.mapping) return output;
      const renamed: Record<string, unknown> = {};
      for (const [newKey, oldKey] of Object.entries(mapping.mapping)) {
        if (oldKey in output) {
          renamed[newKey] = output[oldKey];
        }
      }
      // Also pass through keys that aren't being renamed
      for (const [key, value] of Object.entries(output)) {
        const isRenamed = Object.values(mapping.mapping).includes(key);
        if (!isRenamed) {
          renamed[key] = value;
        }
      }
      return renamed;
    }

    case 'wrap': {
      if (!mapping.key) return output;
      return { [mapping.key]: output };
    }

    default:
      return output;
  }
}
