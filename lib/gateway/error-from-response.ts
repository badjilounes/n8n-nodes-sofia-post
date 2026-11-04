import { asFields } from './read-fields';
import { SofiaApiError } from './sofia-api-gateway';

const isText = (value: unknown): value is string => typeof value === 'string';

function retryAfter(header: string | undefined): number | undefined {
  const seconds = Number(header);
  return header !== undefined && Number.isFinite(seconds) ? seconds : undefined;
}

/** The envelope's `message` already names each refused field or network reason (SPROD-131). */
export function errorFromResponse(
  status: number,
  body: unknown,
  retryAfterHeader?: string,
): SofiaApiError {
  const envelope = asFields(asFields(body)['error']);
  const code = isText(envelope['code']) ? envelope['code'] : `http_${status}`;
  const message = isText(envelope['message'])
    ? envelope['message']
    : `Sofia API answered ${status}.`;
  return new SofiaApiError(status, code, message, retryAfter(retryAfterHeader));
}
