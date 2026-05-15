# Writing test cases in Jira

Create **functional** test cases as **Jira issues** (issue type **Test Case**) from a **Story** issue, using the **Atlassian MCP Server** (`user-Atlassian-MCP-Server`). Use US English. Cases are written for **human QA** first; automation (for example Python and Playwright) is done manually later.

**Project config (required):** [jira-config.local.json](./jira-config.local.json) — **gitignored**; copy [jira-config.example.json](./jira-config.example.json) and fill in your site. Never commit the local file.  
**Description layout:** [template.md](./template.md)

---

## Scope

When the user asks to create or write test cases and gives a **Jira story** (key or URL), scope **that story only**. Produce clear, atomic cases that map to acceptance criteria in the story description.

- Deliver results **only as Jira Test Case issues** linked to the story—do **not** create repo files unless the user explicitly asks.
- **API and unit test suites** as separate automation deliverables are out of scope; for **Backend/API** acceptance items, **Expected result** still states **HTTP status** and **JSON fields** (the API is the source of truth).

**Environment (default):** local machine, single-page UI where relevant, stateless session (no persistence or teardown scenarios). Do not add production URLs, locator strategy, BDD/Gherkin, or extra automation metadata unless the user asks.

---

## Test case content rules

### Coverage

- At least **one Test Case per numbered acceptance criterion**, including **negative and edge** cases implied by that AC.
- **Exception:** When several ACs share the **same step sequence** (same order, same starting state), use **one** Test Case and note covered AC numbers in the **issue link comment** (not in Description unless the user asks).

### Classification

- Each case is **smoke** or **regression**.
- Put **`[smoke]`** or **`[reg]`** at the end of the Jira **Summary** (title).
- Optionally mirror with labels from `jira-config.local.json` (`smoke`, `regression`).

### Voice

- Plain language for a non-technical reader.
- No CSS selectors, waits, or assertion APIs—the QA owner decides those when automating.
- **UI:** Describe what the player sees or can do, not DOM attributes.
- **Backend/API:** Expected result lines for status codes and JSON fields per the story.

### Initial state

- Assume the browser is already open on the local app and the player can play (deposit if needed).
- Do not start Steps with “Open the browser…” unless the case truly starts elsewhere.

### Slot randomness

- Do **not** require predicting exact symbols or jackpots.
- Focus on validation, balance math, messages, spin-in-flight behavior, and UI matching the **server response** for that spin.
- If a case needs a fixed outcome for automation, mention it only in a link comment—not as a blocker for writing the case.

---

## Steps and expected result format (required)

Use **checklist-style** steps with **inline verification** in the Jira **Description**—not long prose.

### Steps (in Description)

- **Numbered list** only. Each number is **one action**: a short imperative (for example “Click on the **info** control.”, “Send `POST /game/spin` with valid `balance`, `lines`, and `bet`.”).
- **One main action per step.** About one sentence per action line.
- **Indented sub-bullets** under a step when something must be checked **immediately after** that action. Each sub-bullet starts with **Verify** or **Confirm** and states one observable fact.
- Put **step-tied checks** in sub-bullets. Put **overall end-state** in **Expected result**. Avoid duplicating the same check in both unless the story needs it.
- Number steps sequentially (1, 2, 3—no gaps).

**Example (UI):**

```markdown
## Steps

1. Click on the **info** control.
    - Verify the modal is opened.
2. Click once on the **outside** backdrop area.
3. Try a normal main-game control (for example change bet or **Spin**).
```

### Expected result (in Description)

- **Final outcome only**—what must be true when all steps are done.
- **Short declarative sentences**, **one per line** (no single long paragraph).
- Bold **control names** or key values sparingly.
- **Backend/API:** one line for HTTP status, then one line per JSON field or response rule.

**Example (UI):**

```markdown
## Expected result

The info layer is closed.
The **main game** is **fully visible and interactive** again, with **no** leftover overlay-only appearance.
```

### Jira field mapping

| Content | Jira field |
|---------|------------|
| Title (with `[smoke]` / `[reg]`) | **Summary** |
| Steps + Expected result | **Description** — only `## Steps` and `## Expected result` per [template.md](./template.md) |

Do **not** put the story text, Preconditions, Maps to AC, or Notes in Description unless the user asks.

---

## What you need from the user

Any of these (extract the issue key, e.g. `PROJ-7`):

- Issue key: `PROJ-7`
- Browse URL: `{siteUrl}/browse/PROJ-7` (from local config)
- Chat: “write test cases for PROJ-7”

Optional: “only smoke”, “skip duplicates”. Optional repo `user-stories/...md` for extra context—**Jira story description remains the primary AC source**.

---

## MCP server and tools

| Step | MCP tool | Purpose |
|------|----------|---------|
| Resolve site | `getAccessibleAtlassianResources` | Get `cloudId` if config hostname fails |
| Read story | `getJiraIssue` | Story key, `responseContentFormat`: `markdown` |
| List fields (if config stale) | `getJiraIssueTypeMetaWithFields` | `projectIdOrKey`, `issueTypeId` from config |
| Avoid duplicates | `searchJiraIssuesUsingJql` | Bounded JQL |
| Create case | `createJiraIssue` | See **Create Test Case** |
| Link to story | `createIssueLink` | Type from config |

**cloudId:** `jira-config.local.json` → `cloudId`, or `siteUrl` hostname (without `https://`), or `getAccessibleAtlassianResources`.

**Before any Jira write:** load `jira-config.local.json`. If missing, tell the user to copy `jira-config.example.json` → `jira-config.local.json` (see README).

---

## Workflow

### 1. Parse input

- From URL `…/browse/PROJ-7` → key `PROJ-7`.
- Prefer keys matching `projectKey` in local config unless the user names another project (update config first).

### 2. Load the story

`getJiraIssue` with `cloudId`, story key, `responseContentFormat`: `markdown`.

Confirm issue type matches `storyIssueTypeName` in config. Read **summary** and **description** for acceptance criteria.

If description is empty, stop and ask the user to add AC to the Jira story.

### 3. Plan test cases

Apply **Test case content rules** and **Steps and expected result format** above.

### 4. Check for duplicates (recommended)

Bounded JQL example:

```text
project = PROJ AND issuetype = "Test Case" AND issue in linkedIssues(PROJ-7)
```

If a linked Test Case already has the same **Summary**, skip create and report the existing key.

### 5. Create Test Case

`createJiraIssue`:

| Parameter | Value |
|-----------|--------|
| `cloudId` | Local config |
| `projectKey` | Local config |
| `issueTypeName` | `testCaseIssueTypeName` (often `Test Case`) |
| `summary` | Title with `[smoke]` or `[reg]` |
| `description` | Per [template.md](./template.md) |
| `contentFormat` | Usually `markdown` |
| `additional_fields` | Labels per config (include `generated-by-agent`) |

### 6. Link Test Case to Story

`createIssueLink`: `issueLinkType` from config; **inwardIssue** = story key; **outwardIssue** = test case key; optional comment e.g. `Covers AC: UI — 1`.

### 7. Report to the user

List each created or skipped issue: `{siteUrl}/browse/{KEY}` from local config.

### 8. Optional: comment on the story

`addCommentToJiraIssue` on the story listing new Test Case keys. Do not edit the story description unless the user asks.

---

## Do not

- Commit or echo `jira-config.local.json` into tracked repo files.
- Create Markdown or other repo test-case files unless the user explicitly requests them.
- Run unbounded JQL.
- Create **Story** issues when the user asked for test cases.
- Put `[smoke]`/`[reg]` only in labels without also putting them in **Summary**.

---

## Troubleshooting

| Problem | Action |
|---------|--------|
| MCP not available | Enable **Atlassian MCP Server** in Cursor and sign in. |
| Missing local config | Copy `jira-config.example.json` → `jira-config.local.json` and fill in. |
| `cloudId` errors | `getAccessibleAtlassianResources` or hostname from `siteUrl`. |
| Wrong issue type | Match `testCaseIssueTypeName` exactly. |
| Link type missing | `getIssueLinkTypes`; update `issueLinkType` in local config. |
