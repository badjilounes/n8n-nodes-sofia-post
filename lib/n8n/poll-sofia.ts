import type { IDataObject, INodeExecutionData, IPollFunctions } from 'n8n-workflow';
import { textOf } from '../gateway/read-fields';
import { ListPostsInput, listPostsByStatus, PostStatusFilter } from '../posts/list-posts-by-status';
import { newPostsSince } from '../posts/new-posts';
import { PostOutput } from '../posts/post-output';
import { N8nSofiaApiGateway } from './n8n-sofia-api-gateway';
import { toNodeError } from './to-node-error';

const STATUS_OF_EVENT: Readonly<Record<string, PostStatusFilter>> = {
  postPublished: 'published',
  postFailed: 'failed',
};

/** The ids seen belong to one query: n8n keeps the static data when a parameter changes. */
type PollState = { query?: string; seenIds?: string[] };

type PollOutput = INodeExecutionData[][] | null;

/** n8n's poll contract: `null` means "nothing new", and the workflow does not start. */
function asItems(posts: readonly PostOutput[]): PollOutput {
  // eslint-disable-next-line no-restricted-syntax -- n8n API: `poll` returns `null` when nothing is new
  return posts.length === 0 ? null : [posts.map((post) => ({ json: post as IDataObject }))];
}

function queryOf(functions: IPollFunctions): ListPostsInput {
  const event = String(functions.getNodeParameter('event'));
  const establishmentId = textOf(
    { establishmentId: functions.getNodeParameter('establishmentId', '') },
    'establishmentId',
  );
  return { status: STATUS_OF_EVENT[event] ?? 'published', establishmentId };
}

async function readPage(functions: IPollFunctions, query: ListPostsInput): Promise<PostOutput[]> {
  try {
    return await listPostsByStatus(await N8nSofiaApiGateway.connect(functions), query);
  } catch (error) {
    throw toNodeError(functions.getNode(), error);
  }
}

/**
 * "Fetch Test Event" shows the latest post, so the user can map its fields; an active workflow
 * only fires for posts it has not seen yet, and remembers the page in the workflow's static data.
 */
export async function pollSofia(functions: IPollFunctions): Promise<PollOutput> {
  const query = queryOf(functions);
  const page = await readPage(functions, query);
  if (functions.getMode() === 'manual') {
    return asItems(page.slice(0, 1));
  }
  const state = functions.getWorkflowStaticData('node') as PollState;
  const key = `${query.status}:${query.establishmentId ?? '*'}`;
  const { fresh, seenIds } = newPostsSince(state.query === key ? state.seenIds : undefined, page);
  state.query = key;
  state.seenIds = seenIds;
  return asItems(fresh);
}
