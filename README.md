# 🎲 Daily Emoji Mix 

A GitHub Actions workflow that automatically refreshes a public Gist with three random emojis daily. \
Pin the Gist to your GitHub profile, or fork this repository template to customize your own version!

---

## 📋 Gist Format

Each automated daily run updates the Gist description and `emojis.md`. Example description (title):

`[272/365] Today’s Emojis (2026-09-29)`

The file contains exactly three lines, with one random emoji on each line. Example (content):

```markdown
💩
👍🏼
❤️
```

&nbsp;• The description and date use the UTC+03:00 calendar date and ordinal day of the year. \
&nbsp;• The file contains three distinct random emojis selected from the Unicode pool, excluding flags. \
&nbsp;• The description is plain text; the workflow updates it and the file together each day.

---

## ⏰ Schedule & Time Zone

The workflow runs daily at **00:00 UTC+03:00** by default. \
&nbsp;• **Timezone:** `Etc/GMT-3` (fixed UTC+03:00 offset, invariant to daylight saving time). \
&nbsp;• The date and emojis in the Gist update in sync with this timezone.

> **Scheduled-run timing:** GitHub may start scheduled workflows later than the specified time during periods of high Actions load, so 00:00 is the target time rather than a guaranteed start time. In public repositories, GitHub may disable scheduled workflows after 60 days without repository activity. If the schedule stops, check the repository's **Actions** settings and re-enable the workflow if needed.

---

## 🎨 Emoji Source

The script fetches the latest official Unicode specification ([`emoji-test.txt`](https://www.unicode.org/Public/emoji/latest/emoji-test.txt)) directly on each run: \
&nbsp;• Filters for fully-qualified emoji sequences (including complex modifiers and skin-tone variants). \
&nbsp;• Excludes the Unicode Flags group for consistent cross-platform rendering across desktop, mobile, and web. \
&nbsp;• Requires zero extra `npm` dependencies because it runs directly using Node.js built-ins.

> [!NOTE]
> The emojis are selected randomly using Node.js cryptographic `randomInt`.

---

## 🚀 Setup Guide

&nbsp;1. **Create a Public Gist:** \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Go to [gist.github.com](https://gist.github.com) and create a new **Public Gist**. \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Enter **file name** `emojis.md`, any **description**, and any starter **content**; the workflow replaces both daily. \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Copy the **Gist ID** from the URL (the alphanumeric hash at the end) and save it temporarily. \
&nbsp;2. **Fork or Template:** \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• **Fork** this repository or use it as a **template** (note that forks are public but templates can be private). \
&nbsp;3. **Configure Secrets & Variables:** \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• In your new repository, navigate to **Settings → Secrets and variables → Actions** and add the following: \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;i. **Variable** `GIST_ID`: Enter your Gist ID (that you previously copied). \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;ii. **Secret** `GH_TOKEN`: Create a [Fine-Grained Personal Access Token](https://github.com/settings/tokens?type=beta) with **Gists: Read and write** permission \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;(Note: add a token name and description of your choice, make resource owner yourself, set an expi- \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;-ration date, and choose public repos for the repository access - then save the value as the secret!) \
&nbsp;4. **Trigger First Run:** \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Go to the repository **Actions** tab, select **Update Gist**, and click **Run workflow** (only for the first time). \
&nbsp;5. **Pin to Profile:** \
&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;• Visit your GitHub profile page, click **Customize your pins**, and select your Gist to be displayed!

---

## ⚙️ Configuration

| Name | Type | Required | Default | Description |
| :---: | :---: | :---: | :---: | :---: |
| `GH_TOKEN` | Actions secret | Yes | — | Fine-grained PAT with Gists read/write permission. |
| `GIST_ID` | Actions variable | Yes | — | ID of the target Gist to update. |
| `GIST_FILENAME` | Actions variable | No | `emojis.md` | File name inside the Gist. |

> [!TIP]
> To change the number of daily emojis, adjust `const emojiCount = 3;` at the top of [`updater.mjs`](updater.mjs).

---

## 🔒 Security Best Practices

&nbsp;• **Strict Token Scoping:** Grant permissions only for **Gists (Read & Write)**. Never grant repository, workflow, or administrative scopes. \
&nbsp;• **Store as Secret:** Never hardcode or commit tokens to the repository. \
&nbsp;• **Public Visibility:** Note that public Gists and their revision histories are visible to everyone.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE). \
Emoji data is fetched from Unicode at runtime and remains subject to [Unicode Terms of Use](https://www.unicode.org/terms_of_use.html).

