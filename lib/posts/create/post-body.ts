import { AccountOutput } from '../../accounts/list-accounts';

export type MediaType = 'image' | 'video';

const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.webm', '.m4v'];

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    throw new PostInputError(`« ${url} » is not a full media address (https://…).`);
  }
}

/** Video for the usual video extensions, image for anything else, as the CLI does. */
export function inferMediaType(url: string): MediaType {
  const pathname = pathnameOf(url);
  return VIDEO_EXTENSIONS.some((extension) => pathname.endsWith(extension)) ? 'video' : 'image';
}

/** A refusal of the node's own fields, before Sofia is called. */
export class PostInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PostInputError';
  }
}

export type PostBodyInput = {
  establishmentId: string;
  accounts: readonly AccountOutput[];
  text: string;
  mediaUrls: readonly string[];
  format?: string;
  scheduledAt?: string;
  draft: boolean;
};

function timing(input: PostBodyInput): Record<string, string> {
  if (input.draft && input.scheduledAt !== undefined) {
    throw new PostInputError(
      'A draft has no date: leave « Schedule at » empty, or turn « Draft » off.',
    );
  }
  if (input.draft) {
    return { status: 'draft' };
  }
  return input.scheduledAt === undefined ? {} : { scheduledAt: input.scheduledAt };
}

/** One target per chosen account: two accounts of one network are two targets (ADR 0612). */
export function buildPostBody(input: PostBodyInput): Record<string, unknown> {
  const media = input.mediaUrls.map((url) => ({ url, type: inferMediaType(url) }));
  return {
    establishmentId: input.establishmentId,
    targets: input.accounts.map((account) => ({
      platform: account.platform,
      accountId: account.id,
      text: input.text,
      ...(media.length > 0 ? { media } : {}),
      ...(input.format === undefined ? {} : { format: input.format }),
    })),
    ...timing(input),
  };
}
