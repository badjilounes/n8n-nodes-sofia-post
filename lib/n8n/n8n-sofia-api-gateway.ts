import type {
  IExecuteFunctions,
  IHttpRequestOptions,
  ILoadOptionsFunctions,
  IPollFunctions,
} from 'n8n-workflow';
import { errorFromResponse } from '../gateway/error-from-response';
import { asFields } from '../gateway/read-fields';
import { Query, SofiaApiGateway } from '../gateway/sofia-api-gateway';

export const CREDENTIAL_NAME = 'sofiaApi';
export const DEFAULT_API_URL = 'https://api.sofia-post.com/api/v1';

/** The n8n contexts that may call Sofia: an action, a polling trigger, a dropdown. */
export type RequestingFunctions = IExecuteFunctions | IPollFunctions | ILoadOptionsFunctions;

type FullResponse = { statusCode: number; body: unknown; headers?: Record<string, unknown> };

function definedOnly(query: Query = {}): Record<string, string> {
  return Object.fromEntries(
    Object.entries(query).filter((entry): entry is [string, string] => entry[1] !== undefined),
  );
}

function headerOf(headers: Record<string, unknown> = {}, name: string): string | undefined {
  const value = headers[name];
  return value === undefined ? undefined : String(value);
}

/**
 * Goes through `httpRequestWithAuthentication`, so n8n adds the key from the credential and never
 * shows it; the status is read here so that the error envelope of Sofia (ADR 0612) survives.
 */
export class N8nSofiaApiGateway implements SofiaApiGateway {
  constructor(
    private readonly functions: RequestingFunctions,
    private readonly apiUrl: string,
  ) {}

  static async connect(functions: RequestingFunctions): Promise<N8nSofiaApiGateway> {
    const credentials = asFields(await functions.getCredentials(CREDENTIAL_NAME));
    const apiUrl = typeof credentials['apiUrl'] === 'string' ? credentials['apiUrl'] : '';
    return new N8nSofiaApiGateway(functions, apiUrl === '' ? DEFAULT_API_URL : apiUrl);
  }

  get(path: string, query?: Query): Promise<unknown> {
    return this.send({ method: 'GET', url: path, qs: definedOnly(query) });
  }

  post(path: string, body: unknown): Promise<unknown> {
    return this.send({ method: 'POST', url: path, body: asFields(body) });
  }

  private async send(request: IHttpRequestOptions): Promise<unknown> {
    const response = (await this.functions.helpers.httpRequestWithAuthentication.call(
      this.functions,
      CREDENTIAL_NAME,
      {
        ...request,
        baseURL: this.apiUrl,
        json: true,
        headers: { Accept: 'application/json' },
        returnFullResponse: true,
        ignoreHttpStatusErrors: true,
      },
    )) as FullResponse;
    if (response.statusCode >= 400) {
      throw errorFromResponse(
        response.statusCode,
        response.body,
        headerOf(response.headers, 'retry-after'),
      );
    }
    return response.body;
  }
}
