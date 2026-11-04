import {
  NodeConnectionTypes,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
  type IPollFunctions,
} from 'n8n-workflow';
import { pollSofia, sofiaLoadOptions } from '../../lib';

export class SofiaTrigger implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sofia Trigger',
    name: 'sofiaTrigger',
    // The Sofia mark sits on its own orange square: the same file reads on both themes.
    icon: { light: 'file:../../icons/sofia.svg', dark: 'file:../../icons/sofia.svg' },
    group: ['trigger'],
    version: 1,
    subtitle: '={{$parameter["event"]}}',
    description: 'Starts the workflow when a Sofia post is published or fails',
    defaults: { name: 'Sofia Trigger' },
    polling: true,
    inputs: [],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'sofiaApi', required: true }],
    properties: [
      {
        displayName: 'Event',
        name: 'event',
        type: 'options',
        noDataExpression: true,
        options: [
          {
            name: 'Post Failed',
            value: 'postFailed',
            description: 'A network refused the post, even if others published it',
          },
          {
            name: 'Post Published',
            value: 'postPublished',
            description: 'A post went live on at least one network',
          },
        ],
        default: 'postPublished',
      },
      {
        displayName: 'Establishment Name or ID',
        name: 'establishmentId',
        type: 'options',
        typeOptions: { loadOptionsMethod: 'getEstablishments' },
        default: '',
        description:
          'Leave empty to watch every establishment. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
      },
    ],
  };

  methods = { loadOptions: sofiaLoadOptions };

  async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
    return pollSofia(this);
  }
}
