export type Query = Readonly<Record<string, string | undefined>>;

/** Sofia API v1, as seen from an n8n operation. Failures are thrown as `SofiaApiError`. */
export interface SofiaApiGateway {
  get(path: string, query?: Query): Promise<unknown>;
  post(path: string, body: unknown): Promise<unknown>;
}

/** A refusal of Sofia API, read from its single error envelope (ADR 0612). */
export class SofiaApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly retryAfterSeconds?: number,
  ) {
    super(message);
    this.name = 'SofiaApiError';
  }
}
