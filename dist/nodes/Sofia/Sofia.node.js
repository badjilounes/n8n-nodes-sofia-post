"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// apps/sophia-n8n/nodes/Sofia/Sofia.node.ts
var Sofia_node_exports = {};
__export(Sofia_node_exports, {
  Sofia: () => Sofia
});
module.exports = __toCommonJS(Sofia_node_exports);
var import_n8n_workflow2 = require("n8n-workflow");

// libs/sophia-n8n/feature-n8n/src/lib/gateway/read-fields.ts
function asFields(value) {
  return typeof value === "object" && value ? value : {};
}
function listData(body) {
  const data = asFields(body)["data"];
  return Array.isArray(data) ? data.map(asFields) : [];
}
function textOf(fields, key) {
  const value = fields[key];
  return typeof value === "string" && value !== "" ? value : void 0;
}
function textListOf(fields, key) {
  const value = fields[key];
  const items = Array.isArray(value) ? value : typeof value === "string" ? value.split(",") : [];
  return items.map((item) => String(item).trim()).filter((item) => item !== "");
}

// libs/sophia-n8n/feature-n8n/src/lib/accounts/list-accounts.ts
var PLATFORM_NAMES = {
  instagram: "Instagram",
  facebook: "Facebook",
  x: "X",
  linkedin: "LinkedIn",
  tiktok: "TikTok"
};
function labelOf(account) {
  const platform = String(account["platform"]);
  const handle = textOf(account, "handle");
  const who = handle === void 0 ? textOf(account, "name") ?? account["id"] : `@${handle}`;
  return `${PLATFORM_NAMES[platform] ?? platform} \u2014 ${String(who)}`;
}
async function listAccounts(api, establishmentId) {
  const items = listData(
    await api.get(`/establishments/${encodeURIComponent(establishmentId)}/accounts`)
  );
  return items.map((account) => ({
    id: String(account["id"]),
    platform: String(account["platform"]),
    label: labelOf(account),
    status: String(account["status"])
  }));
}

// libs/sophia-n8n/feature-n8n/src/lib/posts/post-output.ts
function toTarget(fields) {
  return {
    platform: String(fields["platform"]),
    accountId: String(fields["accountId"] ?? ""),
    state: String(fields["state"]),
    publishedAt: textOf(fields, "publishedAt"),
    permalink: textOf(fields, "permalink"),
    error: textOf(fields, "error")
  };
}
function joined(values) {
  const present = values.filter((value) => value !== void 0);
  return present.length > 0 ? present.join(" \xB7 ") : void 0;
}
function toPostOutput(body) {
  const post = asFields(body);
  const rawTargets = post["targets"];
  const targets = (Array.isArray(rawTargets) ? rawTargets : []).map(asFields).map(toTarget);
  return {
    id: String(post["id"]),
    status: String(post["status"]),
    establishmentId: String(post["establishmentId"] ?? ""),
    createdAt: textOf(post, "createdAt"),
    scheduledAt: textOf(post, "scheduledAt"),
    platforms: targets.map((target) => target.platform).join(", "),
    permalink: targets.find((target) => target.permalink !== void 0)?.permalink,
    errors: joined(
      targets.map((t) => t.error === void 0 ? void 0 : `${t.platform}: ${t.error}`)
    ),
    targets
  };
}

// libs/sophia-n8n/feature-n8n/src/lib/posts/create/post-body.ts
var VIDEO_EXTENSIONS = [".mp4", ".mov", ".webm", ".m4v"];
function pathnameOf(url) {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    throw new PostInputError(`\xAB ${url} \xBB is not a full media address (https://\u2026).`);
  }
}
function inferMediaType(url) {
  const pathname = pathnameOf(url);
  return VIDEO_EXTENSIONS.some((extension) => pathname.endsWith(extension)) ? "video" : "image";
}
var PostInputError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PostInputError";
  }
};
function timing(input) {
  if (input.draft && input.scheduledAt !== void 0) {
    throw new PostInputError(
      "A draft has no date: leave \xAB Schedule at \xBB empty, or turn \xAB Draft \xBB off."
    );
  }
  if (input.draft) {
    return { status: "draft" };
  }
  return input.scheduledAt === void 0 ? {} : { scheduledAt: input.scheduledAt };
}
function buildPostBody(input) {
  const media = input.mediaUrls.map((url) => ({ url, type: inferMediaType(url) }));
  return {
    establishmentId: input.establishmentId,
    targets: input.accounts.map((account) => ({
      platform: account.platform,
      accountId: account.id,
      text: input.text,
      ...media.length > 0 ? { media } : {},
      ...input.format === void 0 ? {} : { format: input.format }
    })),
    ...timing(input)
  };
}

// libs/sophia-n8n/feature-n8n/src/lib/posts/create/schedule-instant.ts
var HAS_OFFSET = /(Z|[+-]\d{2}:?\d{2})$/i;
function wallClockMs(instantMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).formatToParts(new Date(instantMs));
  const part = (type) => Number(parts.find((p) => p.type === type)?.value);
  return Date.UTC(
    part("year"),
    part("month") - 1,
    part("day"),
    part("hour"),
    part("minute"),
    part("second")
  );
}
function scheduleInstant(value, timeZone) {
  if (HAS_OFFSET.test(value)) {
    return new Date(value).toISOString();
  }
  const asIfUtc = Date.parse(`${value}Z`);
  if (Number.isNaN(asIfUtc)) {
    return value;
  }
  const firstGuess = asIfUtc - (wallClockMs(asIfUtc, timeZone) - asIfUtc);
  const instant = asIfUtc - (wallClockMs(firstGuess, timeZone) - firstGuess);
  return new Date(instant).toISOString();
}

// libs/sophia-n8n/feature-n8n/src/lib/posts/create/create-post.ts
var TRUE_VALUES = ["true", "yes", "1"];
function isTrue(value) {
  return value === true || TRUE_VALUES.includes(String(value).toLowerCase());
}
function required(input, key, label) {
  const value = textOf(input, key);
  if (value === void 0) {
    throw new PostInputError(`\xAB ${label} \xBB is required.`);
  }
  return value;
}
function chosenAccounts(all, ids) {
  if (ids.length === 0) {
    throw new PostInputError("Choose at least one account to publish on.");
  }
  return ids.map((id) => {
    const account = all.find((candidate) => candidate.id === id);
    if (account === void 0) {
      throw new PostInputError(`The account ${id} is not connected to this establishment.`);
    }
    return account;
  });
}
async function createPost(api, input, timeZone) {
  const scheduledAt = textOf(input, "scheduledAt");
  const establishmentId = required(input, "establishmentId", "Establishment");
  const text = required(input, "text", "Text");
  const accounts2 = await listAccounts(api, establishmentId);
  const body = buildPostBody({
    establishmentId,
    accounts: chosenAccounts(accounts2, textListOf(input, "accountIds")),
    text,
    mediaUrls: textListOf(input, "mediaUrls"),
    format: textOf(input, "format"),
    scheduledAt: scheduledAt === void 0 ? void 0 : scheduleInstant(scheduledAt, timeZone),
    draft: isTrue(input["draft"])
  });
  return toPostOutput(await api.post("/posts", body));
}

// libs/sophia-n8n/feature-n8n/src/lib/gateway/sofia-api-gateway.ts
var SofiaApiError = class extends Error {
  constructor(status, code, message, retryAfterSeconds) {
    super(message);
    this.status = status;
    this.code = code;
    this.retryAfterSeconds = retryAfterSeconds;
    this.name = "SofiaApiError";
  }
};

// libs/sophia-n8n/feature-n8n/src/lib/posts/get-post.ts
async function getPost(api, postId) {
  try {
    return [toPostOutput(await api.get(`/posts/${encodeURIComponent(postId)}`))];
  } catch (error) {
    if (error instanceof SofiaApiError && error.status === 404) {
      return [];
    }
    throw error;
  }
}

// libs/sophia-n8n/feature-n8n/src/lib/gateway/error-from-response.ts
var isText = (value) => typeof value === "string";
function retryAfter(header) {
  const seconds = Number(header);
  return header !== void 0 && Number.isFinite(seconds) ? seconds : void 0;
}
function errorFromResponse(status, body, retryAfterHeader) {
  const envelope = asFields(asFields(body)["error"]);
  const code = isText(envelope["code"]) ? envelope["code"] : `http_${status}`;
  const message = isText(envelope["message"]) ? envelope["message"] : `Sofia API answered ${status}.`;
  return new SofiaApiError(status, code, message, retryAfter(retryAfterHeader));
}

// libs/sophia-n8n/feature-n8n/src/lib/n8n/n8n-sofia-api-gateway.ts
var CREDENTIAL_NAME = "sofiaApi";
var DEFAULT_API_URL = "https://api.sofia-post.com/api/v1";
function definedOnly(query = {}) {
  return Object.fromEntries(
    Object.entries(query).filter((entry) => entry[1] !== void 0)
  );
}
function headerOf(headers = {}, name) {
  const value = headers[name];
  return value === void 0 ? void 0 : String(value);
}
var N8nSofiaApiGateway = class _N8nSofiaApiGateway {
  constructor(functions, apiUrl) {
    this.functions = functions;
    this.apiUrl = apiUrl;
  }
  static async connect(functions) {
    const credentials = asFields(await functions.getCredentials(CREDENTIAL_NAME));
    const apiUrl = typeof credentials["apiUrl"] === "string" ? credentials["apiUrl"] : "";
    return new _N8nSofiaApiGateway(functions, apiUrl === "" ? DEFAULT_API_URL : apiUrl);
  }
  get(path, query) {
    return this.send({ method: "GET", url: path, qs: definedOnly(query) });
  }
  post(path, body) {
    return this.send({ method: "POST", url: path, body: asFields(body) });
  }
  async send(request) {
    const response = await this.functions.helpers.httpRequestWithAuthentication.call(
      this.functions,
      CREDENTIAL_NAME,
      {
        ...request,
        baseURL: this.apiUrl,
        json: true,
        headers: { Accept: "application/json" },
        returnFullResponse: true,
        ignoreHttpStatusErrors: true
      }
    );
    if (response.statusCode >= 400) {
      throw errorFromResponse(
        response.statusCode,
        response.body,
        headerOf(response.headers, "retry-after")
      );
    }
    return response.body;
  }
};

// libs/sophia-n8n/feature-n8n/src/lib/n8n/to-node-error.ts
var import_n8n_workflow = require("n8n-workflow");
var DEFAULT_RETRY_SECONDS = 60;
function descriptionOf(error) {
  if (error.status === 401) {
    return "Create a new key in Sofia \u203A Settings \u203A API and paste it in the Sofia API credential.";
  }
  if (error.status === 429) {
    return `Try again in ${error.retryAfterSeconds ?? DEFAULT_RETRY_SECONDS} s.`;
  }
  return `Sofia error code: ${error.code}`;
}
function toNodeError(node, error, itemIndex) {
  if (error instanceof SofiaApiError) {
    const envelope = { code: error.code, message: error.message };
    return new import_n8n_workflow.NodeApiError(node, envelope, {
      message: error.message,
      description: descriptionOf(error),
      httpCode: String(error.status),
      itemIndex
    });
  }
  if (error instanceof import_n8n_workflow.NodeError) {
    return error;
  }
  if (error instanceof Error) {
    return new import_n8n_workflow.NodeOperationError(node, error, { itemIndex });
  }
  return new import_n8n_workflow.NodeOperationError(node, String(error), { itemIndex });
}

// libs/sophia-n8n/feature-n8n/src/lib/n8n/execute-sofia.ts
function createInput(functions, itemIndex) {
  const additional = functions.getNodeParameter("additionalFields", itemIndex, {});
  return {
    ...additional,
    establishmentId: functions.getNodeParameter("establishmentId", itemIndex),
    accountIds: functions.getNodeParameter("accountIds", itemIndex),
    text: functions.getNodeParameter("text", itemIndex)
  };
}
var OPERATIONS = {
  create: async (functions, api, itemIndex) => [
    await createPost(api, createInput(functions, itemIndex), functions.getTimezone())
  ],
  get: (functions, api, itemIndex) => getPost(api, String(functions.getNodeParameter("postId", itemIndex)))
};
async function runItem(functions, api, itemIndex) {
  const operation = String(functions.getNodeParameter("operation", itemIndex));
  const run = OPERATIONS[operation];
  if (run === void 0) {
    throw new Error(`The operation \xAB ${operation} \xBB is not supported.`);
  }
  const posts = await run(functions, api, itemIndex);
  return posts.map((post) => ({ json: post, pairedItem: { item: itemIndex } }));
}
async function executeSofia(functions) {
  const api = await N8nSofiaApiGateway.connect(functions);
  const output = [];
  const items = functions.getInputData();
  for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
    try {
      output.push(...await runItem(functions, api, itemIndex));
    } catch (error) {
      const nodeError = toNodeError(functions.getNode(), error, itemIndex);
      if (!functions.continueOnFail()) {
        throw nodeError;
      }
      output.push({ json: { error: nodeError.message }, pairedItem: { item: itemIndex } });
    }
  }
  return [output];
}

// libs/sophia-n8n/feature-n8n/src/lib/establishments/list-establishments.ts
async function listEstablishments(api) {
  const items = listData(await api.get("/establishments"));
  return items.map((item) => ({ id: String(item["id"]), name: String(item["name"] ?? "") }));
}

// libs/sophia-n8n/feature-n8n/src/lib/n8n/load-options.ts
async function establishments() {
  try {
    const api = await N8nSofiaApiGateway.connect(this);
    const items = await listEstablishments(api);
    return items.map((item) => ({ name: item.name, value: item.id }));
  } catch (error) {
    throw toNodeError(this.getNode(), error);
  }
}
async function accounts() {
  const establishmentId = textOf({ id: this.getCurrentNodeParameter("establishmentId") }, "id");
  if (establishmentId === void 0) {
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
var sofiaLoadOptions = {
  getEstablishments: establishments,
  getAccounts: accounts
};

// apps/sophia-n8n/nodes/Sofia/post-properties.ts
var showFor = (operation) => ({ show: { resource: ["post"], operation: [operation] } });
var postOperation = {
  displayName: "Operation",
  name: "operation",
  type: "options",
  noDataExpression: true,
  displayOptions: { show: { resource: ["post"] } },
  options: [
    {
      name: "Create",
      value: "create",
      description: "Publish now, schedule or save a draft on the chosen accounts",
      action: "Create a post"
    },
    {
      name: "Get",
      value: "get",
      description: "Read a post and the state of each network",
      action: "Get a post"
    }
  ],
  default: "create"
};
var postFields = [
  {
    displayName: "Establishment Name or ID",
    name: "establishmentId",
    type: "options",
    typeOptions: { loadOptionsMethod: "getEstablishments" },
    required: true,
    default: "",
    description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>',
    displayOptions: showFor("create")
  },
  {
    displayName: "Account Names or IDs",
    name: "accountIds",
    type: "multiOptions",
    typeOptions: { loadOptionsMethod: "getAccounts", loadOptionsDependsOn: ["establishmentId"] },
    required: true,
    default: [],
    description: 'One post per chosen account. Choose from the list, or specify IDs using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
    displayOptions: showFor("create")
  },
  {
    displayName: "Text",
    name: "text",
    type: "string",
    typeOptions: { rows: 4 },
    required: true,
    default: "",
    description: "The caption, the same on every chosen account",
    displayOptions: showFor("create")
  },
  {
    displayName: "Additional Fields",
    name: "additionalFields",
    type: "collection",
    placeholder: "Add Field",
    default: {},
    displayOptions: showFor("create"),
    options: [
      {
        displayName: "Draft",
        name: "draft",
        type: "boolean",
        default: false,
        description: "Whether to save the post as a draft in Sofia instead of publishing it"
      },
      {
        displayName: "Format",
        name: "format",
        type: "options",
        options: [
          { name: "Carousel", value: "carousel" },
          { name: "Post", value: "post" },
          { name: "Reel", value: "reel" },
          { name: "Story", value: "story" }
        ],
        default: "post",
        description: "Leave out for the format the network would use"
      },
      {
        displayName: "Media URLs",
        name: "mediaUrls",
        type: "string",
        default: "",
        placeholder: "https://example.com/photo.jpg, https://example.com/clip.mp4",
        description: "Public addresses of the images or videos, separated by commas. A .mp4, .mov, .webm or .m4v address is sent as a video."
      },
      {
        displayName: "Schedule At",
        name: "scheduledAt",
        type: "dateTime",
        default: "",
        description: "When to publish, in the workflow's time zone. Leave out to publish now. Not allowed on a draft."
      }
    ]
  },
  {
    displayName: "Post ID",
    name: "postId",
    type: "string",
    required: true,
    default: "",
    description: "The ID returned when the post was created",
    displayOptions: showFor("get")
  }
];

// apps/sophia-n8n/nodes/Sofia/Sofia.node.ts
var Sofia = class {
  constructor() {
    this.description = {
      displayName: "Sofia",
      name: "sofia",
      // The Sofia mark sits on its own orange square: the same file reads on both themes.
      icon: { light: "file:../../icons/sofia.svg", dark: "file:../../icons/sofia.svg" },
      group: ["output"],
      version: 1,
      subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
      description: "Publish, schedule and read social media posts with Sofia",
      defaults: { name: "Sofia" },
      usableAsTool: true,
      inputs: [import_n8n_workflow2.NodeConnectionTypes.Main],
      outputs: [import_n8n_workflow2.NodeConnectionTypes.Main],
      credentials: [{ name: "sofiaApi", required: true }],
      properties: [
        {
          displayName: "Resource",
          name: "resource",
          type: "options",
          noDataExpression: true,
          options: [{ name: "Post", value: "post" }],
          default: "post"
        },
        postOperation,
        ...postFields
      ]
    };
    this.methods = { loadOptions: sofiaLoadOptions };
  }
  async execute() {
    return executeSofia(this);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Sofia
});
