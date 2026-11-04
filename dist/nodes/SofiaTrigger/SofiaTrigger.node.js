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

// apps/sophia-n8n/nodes/SofiaTrigger/SofiaTrigger.node.ts
var SofiaTrigger_node_exports = {};
__export(SofiaTrigger_node_exports, {
  SofiaTrigger: () => SofiaTrigger
});
module.exports = __toCommonJS(SofiaTrigger_node_exports);
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

// libs/sophia-n8n/feature-n8n/src/lib/posts/list-posts-by-status.ts
var PAGE_SIZE = "100";
async function listPostsByStatus(api, input) {
  const page = await api.get("/posts", {
    status: input.status,
    establishmentId: input.establishmentId,
    limit: PAGE_SIZE
  });
  return listData(page).map(toPostOutput);
}

// libs/sophia-n8n/feature-n8n/src/lib/posts/new-posts.ts
function newPostsSince(previouslySeen, page) {
  const seenIds = page.map((post) => post.id);
  if (previouslySeen === void 0) {
    return { fresh: [], seenIds };
  }
  const seen = new Set(previouslySeen);
  return { fresh: page.filter((post) => !seen.has(post.id)), seenIds };
}

// libs/sophia-n8n/feature-n8n/src/lib/n8n/poll-sofia.ts
var STATUS_OF_EVENT = {
  postPublished: "published",
  postFailed: "failed"
};
function asItems(posts) {
  return posts.length === 0 ? null : [posts.map((post) => ({ json: post }))];
}
function queryOf(functions) {
  const event = String(functions.getNodeParameter("event"));
  const establishmentId = textOf(
    { establishmentId: functions.getNodeParameter("establishmentId", "") },
    "establishmentId"
  );
  return { status: STATUS_OF_EVENT[event] ?? "published", establishmentId };
}
async function readPage(functions, query) {
  try {
    return await listPostsByStatus(await N8nSofiaApiGateway.connect(functions), query);
  } catch (error) {
    throw toNodeError(functions.getNode(), error);
  }
}
async function pollSofia(functions) {
  const query = queryOf(functions);
  const page = await readPage(functions, query);
  if (functions.getMode() === "manual") {
    return asItems(page.slice(0, 1));
  }
  const state = functions.getWorkflowStaticData("node");
  const key = `${query.status}:${query.establishmentId ?? "*"}`;
  const { fresh, seenIds } = newPostsSince(state.query === key ? state.seenIds : void 0, page);
  state.query = key;
  state.seenIds = seenIds;
  return asItems(fresh);
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

// apps/sophia-n8n/nodes/SofiaTrigger/SofiaTrigger.node.ts
var SofiaTrigger = class {
  constructor() {
    this.description = {
      displayName: "Sofia Trigger",
      name: "sofiaTrigger",
      // The Sofia mark sits on its own orange square: the same file reads on both themes.
      icon: { light: "file:../../icons/sofia.svg", dark: "file:../../icons/sofia.svg" },
      group: ["trigger"],
      version: 1,
      subtitle: '={{$parameter["event"]}}',
      description: "Starts the workflow when a Sofia post is published or fails",
      defaults: { name: "Sofia Trigger" },
      polling: true,
      inputs: [],
      outputs: [import_n8n_workflow2.NodeConnectionTypes.Main],
      credentials: [{ name: "sofiaApi", required: true }],
      properties: [
        {
          displayName: "Event",
          name: "event",
          type: "options",
          noDataExpression: true,
          options: [
            {
              name: "Post Failed",
              value: "postFailed",
              description: "A network refused the post, even if others published it"
            },
            {
              name: "Post Published",
              value: "postPublished",
              description: "A post went live on at least one network"
            }
          ],
          default: "postPublished"
        },
        {
          displayName: "Establishment Name or ID",
          name: "establishmentId",
          type: "options",
          typeOptions: { loadOptionsMethod: "getEstablishments" },
          default: "",
          description: 'Leave empty to watch every establishment. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.'
        }
      ]
    };
    this.methods = { loadOptions: sofiaLoadOptions };
  }
  async poll() {
    return pollSofia(this);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SofiaTrigger
});
