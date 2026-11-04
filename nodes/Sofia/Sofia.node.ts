import {
  NodeConnectionTypes,
  type IExecuteFunctions,
  type INodeExecutionData,
  type INodeType,
  type INodeTypeDescription,
} from 'n8n-workflow';
import { executeSofia, sofiaLoadOptions } from '../../lib';
import { postFields, postOperation } from './post-properties';

export class Sofia implements INodeType {
  description: INodeTypeDescription = {
    displayName: 'Sofia',
    name: 'sofia',
    // The Sofia mark sits on its own orange square: the same file reads on both themes.
    icon: { light: 'file:../../icons/sofia.svg', dark: 'file:../../icons/sofia.svg' },
    group: ['output'],
    version: 1,
    subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
    description: 'Publish, schedule and read social media posts with Sofia',
    defaults: { name: 'Sofia' },
    usableAsTool: true,
    inputs: [NodeConnectionTypes.Main],
    outputs: [NodeConnectionTypes.Main],
    credentials: [{ name: 'sofiaApi', required: true }],
    properties: [
      {
        displayName: 'Resource',
        name: 'resource',
        type: 'options',
        noDataExpression: true,
        options: [{ name: 'Post', value: 'post' }],
        default: 'post',
      },
      postOperation,
      ...postFields,
    ],
  };

  methods = { loadOptions: sofiaLoadOptions };

  async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
    return executeSofia(this);
  }
}
