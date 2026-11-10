# n8n-nodes-sofia-post

Publish, schedule and follow your social media posts with [Sofia](https://www.sofia-post.com) from any n8n workflow.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Example](#example) · [Compatibility](#compatibility) · [Resources](#resources)

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

## Example

A workflow that schedules a post on Instagram and Facebook, then reads its state.

### 1. Create the post

Add a **Sofia** node, choose **Post › Create**, and fill it in:

| Field                           | Value                                                        |
| ------------------------------- | ------------------------------------------------------------ |
| Establishment Name or ID        | `Bistrot Lumiere`                                            |
| Account Names or IDs            | `Instagram — @bistrot_lumiere`, `Facebook — Bistrot Lumiere` |
| Text                            | `Fresh pasta is back on the menu this Friday.`               |
| Additional Fields › Media URLs  | `https://example.com/pasta.jpg`                              |
| Additional Fields › Schedule At | `2026-11-13T11:30:00`                                        |

**Establishment** and **Accounts** are dropdowns filled from Sofia; **Accounts** lists the networks connected to the chosen establishment. Leave **Schedule At** empty to publish now, or turn **Draft** on to save the post without publishing it.

The node returns one item:

```json
{
  "id": "pst_01HZX4T9M2",
  "status": "scheduled",
  "establishmentId": "est_01HZX4R7K8",
  "createdAt": "2026-11-10T09:12:44.000Z",
  "scheduledAt": "2026-11-13T10:30:00.000Z",
  "platforms": "instagram, facebook",
  "targets": [
    { "platform": "instagram", "accountId": "acc_01HZX4S1A1", "state": "scheduled" },
    { "platform": "facebook", "accountId": "acc_01HZX4S1B2", "state": "scheduled" }
  ]
}
```

`scheduledAt` is the instant Sofia will publish at: here 11:30 in a workflow whose time zone is Europe/Paris.

### 2. Read the post

Add a second **Sofia** node, choose **Post › Get**, and set **Post ID** to `{{ $json.id }}`. Once the post is out, the item carries the link and what each network answered:

```json
{
  "id": "pst_01HZX4T9M2",
  "status": "partial",
  "establishmentId": "est_01HZX4R7K8",
  "createdAt": "2026-11-10T09:12:44.000Z",
  "scheduledAt": "2026-11-13T10:30:00.000Z",
  "platforms": "instagram, facebook",
  "permalink": "https://www.instagram.com/p/DCxyz123/",
  "errors": "facebook: the page is no longer connected",
  "targets": [
    {
      "platform": "instagram",
      "accountId": "acc_01HZX4S1A1",
      "state": "published",
      "publishedAt": "2026-11-13T10:30:05.000Z",
      "permalink": "https://www.instagram.com/p/DCxyz123/"
    },
    {
      "platform": "facebook",
      "accountId": "acc_01HZX4S1B2",
      "state": "failed",
      "error": "the page is no longer connected"
    }
  ]
}
```

`partial` means the post went live on one network and was refused by another; a post that every network accepted is `published`.

### 3. React to a result

Start another workflow with a **Sofia Trigger** node on **Post Failed**, and connect it to a Slack or email node with a message such as `{{ $json.platforms }}: {{ $json.errors }}`. The trigger emits the same item as **Post › Get**, once per post.

## Compatibility

Built and tested against `n8n-workflow` 2.x, with n8n nodes API version 1.

## Resources

- [Sofia developer documentation](https://www.sofia-post.com/developers)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

This package is built from the Sofia monorepo and published from this repository by GitHub Actions, with an npm provenance statement.
