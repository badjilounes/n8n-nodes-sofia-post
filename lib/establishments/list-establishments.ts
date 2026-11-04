import { listData } from '../gateway/read-fields';
import { SofiaApiGateway } from '../gateway/sofia-api-gateway';

export type EstablishmentOutput = { id: string; name: string };

/** Every establishment of every Workspace the key's author belongs to (ADR 0610). */
export async function listEstablishments(api: SofiaApiGateway): Promise<EstablishmentOutput[]> {
  const items = listData(await api.get('/establishments'));
  return items.map((item) => ({ id: String(item['id']), name: String(item['name'] ?? '') }));
}
