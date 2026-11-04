import { listData } from '../gateway/read-fields';
import { SofiaApiGateway } from '../gateway/sofia-api-gateway';
import { PostOutput, toPostOutput } from './post-output';

/** Sofia matches a post when at least one of its networks is in that state: a `partial` post is both. */
export type PostStatusFilter = 'published' | 'failed';

/** The API's maximum: the trigger deduplicates by `id`, Sofia lists newest first. */
const PAGE_SIZE = '100';

export type ListPostsInput = { status: PostStatusFilter; establishmentId?: string };

export async function listPostsByStatus(
  api: SofiaApiGateway,
  input: ListPostsInput,
): Promise<PostOutput[]> {
  const page = await api.get('/posts', {
    status: input.status,
    establishmentId: input.establishmentId,
    limit: PAGE_SIZE,
  });
  return listData(page).map(toPostOutput);
}
