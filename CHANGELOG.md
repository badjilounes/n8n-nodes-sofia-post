# Changelog

## 0.1.2

- The repository now carries the TypeScript sources at its root (credentials/, nodes/, lib/), next to the built package, as n8n's verification expects.

## 0.1.1

- Create: a media URL that is not a full address is refused by name, before Sofia is called.
- First release published through npm trusted publishing (OIDC), with provenance.

## 0.1.0

- Sofia API credential, with a personal key.
- Sofia node: create a post (publish now, schedule or save a draft, on one or several accounts), get a post.
- Sofia Trigger: Post Published, Post Failed.
