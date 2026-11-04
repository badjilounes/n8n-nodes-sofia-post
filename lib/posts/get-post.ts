import { SofiaApiGateway, SofiaApiError } from '../gateway/sofia-api-gateway';
import { PostOutput, toPostOutput } from './post-output';

/** No item when the post is unknown: the workflow goes on with an empty output instead of failing. */
export async function getPost(api: SofiaApiGateway, postId: string): Promise<PostOutput[]> {
  try {
    return [toPostOutput(await api.get(`/posts/${encodeURIComponent(postId)}`))];
  } catch (error) {
    if (error instanceof SofiaApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}
