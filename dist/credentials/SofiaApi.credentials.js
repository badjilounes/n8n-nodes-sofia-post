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

// apps/sophia-n8n/credentials/SofiaApi.credentials.ts
var SofiaApi_credentials_exports = {};
__export(SofiaApi_credentials_exports, {
  SofiaApi: () => SofiaApi
});
module.exports = __toCommonJS(SofiaApi_credentials_exports);
var SofiaApi = class {
  constructor() {
    this.name = "sofiaApi";
    this.displayName = "Sofia API";
    this.icon = { light: "file:../icons/sofia.svg", dark: "file:../icons/sofia.svg" };
    this.documentationUrl = "https://github.com/badjilounes/n8n-nodes-sofia-post?tab=readme-ov-file#credentials";
    this.properties = [
      {
        displayName: "Personal Key",
        name: "apiKey",
        type: "string",
        typeOptions: { password: true },
        required: true,
        default: "",
        placeholder: "sofia_pk_live_\u2026",
        description: "Create it in Sofia \u203A Settings \u203A API"
      },
      {
        displayName: "API URL",
        name: "apiUrl",
        type: "string",
        default: "https://api.sofia-post.com/api/v1",
        description: "Leave as is, unless Sofia support gives you another address"
      }
    ];
    this.authenticate = {
      type: "generic",
      properties: {
        headers: {
          Authorization: "=Bearer {{$credentials.apiKey}}"
        }
      }
    };
    this.test = {
      request: {
        baseURL: "={{$credentials.apiUrl}}",
        url: "/me"
      }
    };
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SofiaApi
});
