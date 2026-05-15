# Jira Test Case — Description body

Use this as the **Description** field when creating a **Test Case** issue.  
**Summary** (title) is set separately, including `[smoke]` or `[reg]` at the end of the title. Do not put the title in Description.

---

## Steps

Numbered list. Each item is **one short action** (imperative).

When something must be checked **right after** that action, add **indented sub-bullets** starting with **Verify** or **Confirm**.

1. Click on the **info** control.
    - Verify the modal is opened.
2. Click once on the **outside** backdrop area.
    - Verify the info layer is closed.
3. ...

**Rules for Steps:**

- One main action per numbered step; about one sentence each.
- Sequential numbering (1, 2, 3—no gaps).
- Assume browser is on the local app and the player can play unless the case says otherwise.
- Do not open with “Open the browser…” unless required.
- Step-tied checks go in sub-bullets; final end-state goes under **Expected result** below.

---

## Expected result

Final outcome only when all steps are done.

**Rules for Expected result:**

- Short **declarative** sentences, **one per line** (not one paragraph).
- Bold key labels sparingly (for example **Spin**, **main game**).
- **UI stories:** what the player sees or can do.
- **Backend/API stories:** include HTTP status and JSON field rules; API is the source of truth.

The info layer is closed.
The **main game** is **fully visible and interactive** again.

---

## Do not include in Description

Unless the user explicitly asks:

- Story text or acceptance criteria copy-paste
- Preconditions section
- “Maps to acceptance criteria” section (use the **issue link comment** instead)
- Notes section
