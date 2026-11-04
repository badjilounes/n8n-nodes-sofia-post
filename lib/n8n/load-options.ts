import type { ILoadOptionsFunctions, INodePropertyOptions } from 'n8n-workflow';
import { listAccounts } from '../accounts/list-accounts';
import { listEstablishments } from '../establishments/list-establishments';
import { textOf } from '../gateway/read-fields';
import { N8nSofiaApiGateway } from './n8n-sofia-api-gateway';
import { toNodeError } from './to-node-error';

async function establishments(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  try {
    const api = await N8nSofiaApiGateway.connect(this);
    const items = await listEstablishments(api);
    return items.map((item) => ({ name: item.name, value: item.id }));
  } catch (error) {
    throw toNodeError(this.getNode(), error);
  }
}

/** Empty until an establishment is chosen: the accounts belong to one establishment. */
async function accounts(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
  const establishmentId = textOf({ id: this.getCurrentNodeParameter('establishmentId') }, 'id');
  if (establishmentId === undefined) {
    return [];
  }
  try {
    const api = await N8nSofiaApiGateway.connect(this);
    const items = await listAccounts(api, establishmentId);
    return items.map((item) => ({ name: item.label, value: item.id, description: item.status }));
  } catch (error) {
    throw toNodeError(this.getNode(), error);
  }
}

/** Named in the node descriptions as `loadOptionsMethod`. */
export const sofiaLoadOptions = {
  getEstablishments: establishments,
  getAccounts: accounts,
};
