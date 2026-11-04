import { AccountOutput, listAccounts } from '../../accounts/list-accounts';
import { Fields, textListOf, textOf } from '../../gateway/read-fields';
import { SofiaApiGateway } from '../../gateway/sofia-api-gateway';
import { PostOutput, toPostOutput } from '../post-output';
import { buildPostBody, PostInputError } from './post-body';
import { scheduleInstant } from './schedule-instant';

const TRUE_VALUES = ['true', 'yes', '1'];

function isTrue(value: unknown): boolean {
  return value === true || TRUE_VALUES.includes(String(value).toLowerCase());
}

function required(input: Fields, key: string, label: string): string {
  const value = textOf(input, key);
  if (value === undefined) {
    throw new PostInputError(`« ${label} » is required.`);
  }
  return value;
}

/** The ids come from the dropdown or from a mapped value: each must still be an account of the establishment. */
function chosenAccounts(all: readonly AccountOutput[], ids: readonly string[]): AccountOutput[] {
  if (ids.length === 0) {
    throw new PostInputError('Choose at least one account to publish on.');
  }
  return ids.map((id) => {
    const account = all.find((candidate) => candidate.id === id);
    if (account === undefined) {
      throw new PostInputError(`The account ${id} is not connected to this establishment.`);
    }
    return account;
  });
}

/** Publishes now, schedules or saves a draft, through the same `POST /v1/posts` as the app. */
export async function createPost(
  api: SofiaApiGateway,
  input: Fields,
  timeZone: string,
): Promise<PostOutput> {
  const scheduledAt = textOf(input, 'scheduledAt');
  const establishmentId = required(input, 'establishmentId', 'Establishment');
  const text = required(input, 'text', 'Text');
  const accounts = await listAccounts(api, establishmentId);
  const body = buildPostBody({
    establishmentId,
    accounts: chosenAccounts(accounts, textListOf(input, 'accountIds')),
    text,
    mediaUrls: textListOf(input, 'mediaUrls'),
    format: textOf(input, 'format'),
    scheduledAt: scheduledAt === undefined ? undefined : scheduleInstant(scheduledAt, timeZone),
    draft: isTrue(input['draft']),
  });
  return toPostOutput(await api.post('/posts', body));
}
