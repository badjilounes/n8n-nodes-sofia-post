import type { IDataObject, IExecuteFunctions, INodeExecutionData } from 'n8n-workflow';
import { SofiaApiGateway } from '../gateway/sofia-api-gateway';
import { Fields } from '../gateway/read-fields';
import { createPost } from '../posts/create/create-post';
import { getPost } from '../posts/get-post';
import { PostOutput } from '../posts/post-output';
import { N8nSofiaApiGateway } from './n8n-sofia-api-gateway';
import { toNodeError } from './to-node-error';

type Operation = (
  functions: IExecuteFunctions,
  api: SofiaApiGateway,
  itemIndex: number,
) => Promise<PostOutput[]>;

/** The node's parameters, read for one item: `additionalFields` is spread so that a missing one stays absent. */
function createInput(functions: IExecuteFunctions, itemIndex: number): Fields {
  const additional = functions.getNodeParameter('additionalFields', itemIndex, {}) as IDataObject;
  return {
    ...additional,
    establishmentId: functions.getNodeParameter('establishmentId', itemIndex),
    accountIds: functions.getNodeParameter('accountIds', itemIndex),
    text: functions.getNodeParameter('text', itemIndex),
  };
}

const OPERATIONS: Readonly<Record<string, Operation>> = {
  create: async (functions, api, itemIndex) => [
    await createPost(api, createInput(functions, itemIndex), functions.getTimezone()),
  ],
  get: (functions, api, itemIndex) =>
    getPost(api, String(functions.getNodeParameter('postId', itemIndex))),
};

async function runItem(
  functions: IExecuteFunctions,
  api: SofiaApiGateway,
  itemIndex: number,
): Promise<INodeExecutionData[]> {
  const operation = String(functions.getNodeParameter('operation', itemIndex));
  const run = OPERATIONS[operation];
  if (run === undefined) {
    throw new Error(`The operation « ${operation} » is not supported.`);
  }
  const posts = await run(functions, api, itemIndex);
  return posts.map((post) => ({ json: post as IDataObject, pairedItem: { item: itemIndex } }));
}

/** One Sofia call per input item; with "Continue On Fail", a refused item becomes an error item. */
export async function executeSofia(functions: IExecuteFunctions): Promise<INodeExecutionData[][]> {
  const api = await N8nSofiaApiGateway.connect(functions);
  const output: INodeExecutionData[] = [];
  const items = functions.getInputData();
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    try {
      output.push(...(await runItem(functions, api, itemIndex)));
    } catch (error) {
      const nodeError = toNodeError(functions.getNode(), error, itemIndex);
      if (!functions.continueOnFail()) {
        throw nodeError;
      }
      output.push({ json: { error: nodeError.message }, pairedItem: { item: itemIndex } });
    }
  }
  return [output];
}
