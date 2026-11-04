import { INode, JsonObject, NodeApiError, NodeError, NodeOperationError } from 'n8n-workflow';
import { SofiaApiError } from '../gateway/sofia-api-gateway';

const DEFAULT_RETRY_SECONDS = 60;

function descriptionOf(error: SofiaApiError): string {
  if (error.status === 401) {
    return 'Create a new key in Sofia › Settings › API and paste it in the Sofia API credential.';
  }
  if (error.status === 429) {
    return `Try again in ${error.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS} s.`;
  }
  return `Sofia error code: ${error.code}`;
}

/**
 * A refusal of Sofia keeps its status and code, so support can find it; a refusal of the node's
 * own fields says which item it was; anything else is shown as n8n would show it.
 */
export function toNodeError(node: INode, error: unknown, itemIndex?: number): NodeError {
  if (error instanceof SofiaApiError) {
    const envelope: JsonObject = { code: error.code, message: error.message };
    return new NodeApiError(node, envelope, {
      message: error.message,
      description: descriptionOf(error),
      httpCode: String(error.status),
      itemIndex,
    });
  }
  if (error instanceof NodeError) {
    return error;
  }
  if (error instanceof Error) {
    return new NodeOperationError(node, error, { itemIndex });
  }
  return new NodeOperationError(node, String(error), { itemIndex });
}
