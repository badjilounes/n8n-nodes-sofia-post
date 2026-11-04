import { asFields, Fields, textOf } from '../gateway/read-fields';

export type PostTargetOutput = {
  platform: string;
  accountId: string;
  state: string;
  publishedAt?: string;
  permalink?: string;
  error?: string;
};

/**
 * The post as Sofia API returns it, plus the fields a workflow maps without walking `targets`: the
 * first link, the platforms, and every network's refusal on one line.
 */
export type PostOutput = {
  id: string;
  status: string;
  establishmentId: string;
  createdAt?: string;
  scheduledAt?: string;
  platforms: string;
  permalink?: string;
  errors?: string;
  targets: PostTargetOutput[];
};

function toTarget(fields: Fields): PostTargetOutput {
  return {
    platform: String(fields['platform']),
    accountId: String(fields['accountId'] ?? ''),
    state: String(fields['state']),
    publishedAt: textOf(fields, 'publishedAt'),
    permalink: textOf(fields, 'permalink'),
    error: textOf(fields, 'error'),
  };
}

function joined(values: (string | undefined)[]): string | undefined {
  const present = values.filter((value): value is string => value !== undefined);
  return present.length > 0 ? present.join(' · ') : undefined;
}

export function toPostOutput(body: unknown): PostOutput {
  const post = asFields(body);
  const rawTargets = post['targets'];
  const targets = (Array.isArray(rawTargets) ? rawTargets : []).map(asFields).map(toTarget);
  return {
    id: String(post['id']),
    status: String(post['status']),
    establishmentId: String(post['establishmentId'] ?? ''),
    createdAt: textOf(post, 'createdAt'),
    scheduledAt: textOf(post, 'scheduledAt'),
    platforms: targets.map((target) => target.platform).join(', '),
    permalink: targets.find((target) => target.permalink !== undefined)?.permalink,
    errors: joined(
      targets.map((t) => (t.error === undefined ? undefined : `${t.platform}: ${t.error}`)),
    ),
    targets,
  };
}
