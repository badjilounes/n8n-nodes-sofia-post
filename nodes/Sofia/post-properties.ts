import type { INodeProperties } from 'n8n-workflow';

const showFor = (operation: string) => ({ show: { resource: ['post'], operation: [operation] } });

export const postOperation: INodeProperties = {
  displayName: 'Operation',
  name: 'operation',
  type: 'options',
  noDataExpression: true,
  displayOptions: { show: { resource: ['post'] } },
  options: [
    {
      name: 'Create',
      value: 'create',
      description: 'Publish now, schedule or save a draft on the chosen accounts',
      action: 'Create a post',
    },
    {
      name: 'Get',
      value: 'get',
      description: 'Read a post and the state of each network',
      action: 'Get a post',
    },
  ],
  default: 'create',
};

export const postFields: INodeProperties[] = [
  {
    displayName: 'Establishment Name or ID',
    name: 'establishmentId',
    type: 'options',
    typeOptions: { loadOptionsMethod: 'getEstablishments' },
    required: true,
    default: '',
    description:
      'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    displayOptions: showFor('create'),
  },
  {
    displayName: 'Account Names or IDs',
    name: 'accountIds',
    type: 'multiOptions',
    typeOptions: { loadOptionsMethod: 'getAccounts', loadOptionsDependsOn: ['establishmentId'] },
    required: true,
    default: [],
    description:
      'One post per chosen account. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: showFor('create'),
  },
  {
    displayName: 'Text',
    name: 'text',
    type: 'string',
    typeOptions: { rows: 4 },
    required: true,
    default: '',
    description: 'The caption, the same on every chosen account',
    displayOptions: showFor('create'),
  },
  {
    displayName: 'Additional Fields',
    name: 'additionalFields',
    type: 'collection',
    placeholder: 'Add Field',
    default: {},
    displayOptions: showFor('create'),
    options: [
      {
        displayName: 'Draft',
        name: 'draft',
        type: 'boolean',
        default: false,
        description: 'Whether to save the post as a draft in Sofia instead of publishing it',
      },
      {
        displayName: 'Format',
        name: 'format',
        type: 'options',
        options: [
          { name: 'Carousel', value: 'carousel' },
          { name: 'Post', value: 'post' },
          { name: 'Reel', value: 'reel' },
          { name: 'Story', value: 'story' },
        ],
        default: 'post',
        description: 'Leave out for the format the network would use',
      },
      {
        displayName: 'Media URLs',
        name: 'mediaUrls',
        type: 'string',
        default: '',
        placeholder: 'https://example.com/photo.jpg, https://example.com/clip.mp4',
        description:
          'Public addresses of the images or videos, separated by commas. A .mp4, .mov, .webm or .m4v address is sent as a video.',
      },
      {
        displayName: 'Schedule At',
        name: 'scheduledAt',
        type: 'dateTime',
        default: '',
        description:
          "When to publish, in the workflow's time zone. Leave out to publish now. Not allowed on a draft.",
      },
    ],
  },
  {
    displayName: 'Post ID',
    name: 'postId',
    type: 'string',
    required: true,
    default: '',
    description: 'The ID returned when the post was created',
    displayOptions: showFor('get'),
  },
];
