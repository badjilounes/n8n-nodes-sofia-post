import { Fields, listData, textOf } from '../gateway/read-fields';
import { SofiaApiGateway } from '../gateway/sofia-api-gateway';

export type AccountOutput = { id: string; platform: string; label: string; status: string };

const PLATFORM_NAMES: Readonly<Record<string, string>> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  linkedin: 'LinkedIn',
  tiktok: 'TikTok',
};

/** « Instagram — @bistrot_lumiere »: what the user recognises in the dropdown. */
function labelOf(account: Fields): string {
  const platform = String(account['platform']);
  const handle = textOf(account, 'handle');
  const who = handle === undefined ? (textOf(account, 'name') ?? account['id']) : `@${handle}`;
  return `${PLATFORM_NAMES[platform] ?? platform} — ${String(who)}`;
}

export async function listAccounts(
  api: SofiaApiGateway,
  establishmentId: string,
): Promise<AccountOutput[]> {
  const items = listData(
    await api.get(`/establishments/${encodeURIComponent(establishmentId)}/accounts`),
  );
  return items.map((account) => ({
    id: String(account['id']),
    platform: String(account['platform']),
    label: labelOf(account),
    status: String(account['status']),
  }));
}
