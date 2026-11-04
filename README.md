# n8n-nodes-sofia-post

Publish, schedule and follow your social media posts with [Sofia](https://www.sofia-post.com) from any n8n workflow.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Compatibility](#compatibility) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation, with the package name `n8n-nodes-sofia-post`.

## Credentials

The **Sofia API** credential takes a personal key:

1. In Sofia, open **Settings › API › Personal access** and create a key. It starts with `sofia_pk_live_`.
2. In n8n, create a **Sofia API** credential and paste the key in **Personal Key**. Leave **API URL** as is.

One key acts for you on every Workspace you belong to, so one credential reaches all your establishments. If Sofia refuses the key (it was revoked or deleted), create a new one and paste it in the same credential.

## Operations

### Sofia

- **Post › Create**: publish now, schedule, or save a draft on one or several connected accounts. One post goes to each chosen account, with the same text. Media are public URLs separated by commas; `.mp4`, `.mov`, `.webm` and `.m4v` are sent as videos, anything else as images. **Schedule At** is read in the workflow's time zone.
- **Post › Get**: read a post and the state of each network. An unknown post returns no item.

The output of a post carries its `id`, `status`, `platforms`, the first `permalink`, every network's refusal on one line in `errors`, and the detail of each network in `targets`.

### Sofia Trigger

- **Post Published**: a post went live on at least one network.
- **Post Failed**: a network refused a post, even if others published it.

The trigger polls Sofia. It starts with the posts that appear after the workflow is activated: posts published before are not replayed. **Fetch Test Event** shows the latest post so you can map its fields. Choose an establishment to watch only that one.

## Compatibility

Built and tested against `n8n-workflow` 2.x, with n8n nodes API version 1.

## Resources

- [Sofia developer documentation](https://www.sofia-post.com/developers)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

This package is built from the Sofia monorepo and published from this repository by GitHub Actions, with an npm provenance statement.
