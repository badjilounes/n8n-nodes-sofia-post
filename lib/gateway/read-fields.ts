export type Fields = Record<string, unknown>;

export function asFields(value: unknown): Fields {
  return typeof value === 'object' && value ? (value as Fields) : {};
}

/** The `data` array of a Sofia API list response, each item as fields. */
export function listData(body: unknown): Fields[] {
  const data = asFields(body)['data'];
  return Array.isArray(data) ? data.map(asFields) : [];
}

export function textOf(fields: Fields, key: string): string | undefined {
  const value = fields[key];
  return typeof value === 'string' && value !== '' ? value : undefined;
}

/** A multi-options field arrives as an array, an expression often as one comma-separated string. */
export function textListOf(fields: Fields, key: string): string[] {
  const value = fields[key];
  const items = Array.isArray(value) ? value : typeof value === 'string' ? value.split(',') : [];
  return items.map((item) => String(item).trim()).filter((item) => item !== '');
}
