import type {
  IAuthenticateGeneric,
  Icon,
  ICredentialTestRequest,
  ICredentialType,
  INodeProperties,
} from 'n8n-workflow';

// The personal key acts for its author on every Workspace they belong to (ADR 0610), so one
// credential reaches all their establishments.
export class SofiaApi implements ICredentialType {
  name = 'sofiaApi';

  displayName = 'Sofia API';

  icon: Icon = { light: 'file:../icons/sofia.svg', dark: 'file:../icons/sofia.svg' };

  documentationUrl =
    'https://github.com/badjilounes/n8n-nodes-sofia-post?tab=readme-ov-file#credentials';

  properties: INodeProperties[] = [
    {
      displayName: 'Personal Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: { password: true },
      required: true,
      default: '',
      placeholder: 'sofia_pk_live_…',
      description: 'Create it in Sofia › Settings › API',
    },
    {
      displayName: 'API URL',
      name: 'apiUrl',
      type: 'string',
      default: 'https://api.sofia-post.com/api/v1',
      description: 'Leave as is, unless Sofia support gives you another address',
    },
  ];

  authenticate: IAuthenticateGeneric = {
    type: 'generic',
    properties: {
      headers: {
        Authorization: '=Bearer {{$credentials.apiKey}}',
      },
    },
  };

  test: ICredentialTestRequest = {
    request: {
      baseURL: '={{$credentials.apiUrl}}',
      url: '/me',
    },
  };
}
