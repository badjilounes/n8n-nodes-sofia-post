import { PostOutput } from './post-output';

export type NewPosts = { fresh: PostOutput[]; seenIds: string[] };

/**
 * The first poll only remembers what it saw: a workflow activated today does not replay every post
 * published before. Afterwards, a post triggers once, the first time its id appears in the page.
 */
export function newPostsSince(
  previouslySeen: readonly string[] | undefined,
  page: readonly PostOutput[],
): NewPosts {
  const seenIds = page.map((post) => post.id);
  if (previouslySeen === undefined) {
    return { fresh: [], seenIds };
  }
  const seen = new Set(previouslySeen);
  return { fresh: page.filter((post) => !seen.has(post.id)), seenIds };
}
