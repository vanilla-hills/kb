# Justice Program KB (Prototype)

A **Vite + React + Tailwind** prototype knowledge base (KB) with:
- Category navigation + Favorites
- Search across topic title/description + article sections/subsections
- In-place expandable topic cards
- Staff/Admin “Edit Topic” modal (prototype-only, in-memory)
- Change Log view with filters

## Tech stack

- React (UI) — entry: `src/main.jsx`
- Vite (dev/build) — config: `vite.config.js`
  - `@` path alias is enabled (`@/*` → `src/*`)
- Tailwind CSS — config: `tailwind.config.js`, CSS entry: `src/index.css`

UI primitives live in:
- `src/components/ui/card.jsx`
- `src/components/ui/input.jsx`

Main app component:
- `src/App.jsx`

---

## Local setup (VS Code)

Run commands from the **test-kb** folder (important):

```bash
cd test-kb
npm install
npm run dev
```

Vite will print a local URL (usually `http://localhost:5173`).

### “Sanity check” commands

```bash
# from test-kb/
npm run lint
npm run build
npm run preview
```

- `lint` verifies ESLint rules pass.
- `build` outputs a production build to `dist/`.
- `preview` serves the built app locally so you can verify production output.

---

## Notes about repo structure

This repo contains a Vite app in the `test-kb/` subfolder.

When deploying, configure the host (Cloudflare Pages) to use `test-kb/` as the project root.

---

## Deploy to Cloudflare Pages

### 1) Push to GitHub

From the repo root (the folder that contains `test-kb/`):

```bash
git init
git add .
git commit -m "Initial KB prototype"
git branch -M main
git remote add origin https://github.com/<you>/<repo>.git
git push -u origin main
```

### 2) Create a Cloudflare Pages project

In Cloudflare Pages:

- Connect to your GitHub repo
- **Root directory:** `test-kb`
- **Build command:** `npm run build`
- **Build output directory:** `dist`
- **Node version:** current LTS (e.g. 20)

Cloudflare will build and deploy the static output.

---

## Supabase (Auth + Database)

This app is designed to use **Supabase Auth** (magic link + a password-based guest account) and a Supabase Postgres database.

### 1) Create tables + RLS policies

In the Supabase dashboard:

- Go to **SQL Editor**
- Paste and run the contents of `test-kb/supabase/schema.sql`

That script creates:

- `profiles` (stores user role: `guest` | `user` | `admin`)
- `kb_categories` (left-nav sections)
- `kb_topics` (cards inside categories)

Access rules are enforced by Postgres **RLS**.

### 2) Environment variables

Create `test-kb/.env` locally:

```bash
VITE_SUPABASE_URL=...your supabase project url...
VITE_SUPABASE_ANON_KEY=...your anon public key...
```

In Cloudflare Pages, add the same variables under:

Project → Settings → Environment variables

### 3) Roles (guest restrictions)

- Guests can only view/search categories/topics where `min_role = 'guest'`.
- Admins can restrict a category/topic by setting `min_role = 'user'`.
- Guests cannot create/edit content; admin and user can edit topics/cards.

---

## Troubleshooting

### “Missing script: dev”

You are not in the `test-kb/` folder.

### “Cannot find module '@/...'”

Confirm the alias exists in:
- `vite.config.js` (`resolve.alias["@"]`)
- `jsconfig.json` (`paths: { "@/*": ["src/*"] }`)

### Tailwind styles not applying

- Confirm `src/index.css` includes Tailwind directives.
- Restart the dev server after config changes.

---

## Current limitations (prototype)

- No backend persistence yet (edits/favorites/recent/change log are in-memory only)
- Auth/roles are placeholders in `src/App.jsx`
```

* Update `tailwind.config.*` content paths:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
};
```

* Add Tailwind directives to `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

If the default Vite page “looks weird” after adding Tailwind, that’s normal because Tailwind resets styles.

---

## Cloudflare Pages deployment (static)

This app can deploy as a static build.

### Build

From the project folder:

```bash
npm run build
```

Vite outputs to:

* `dist/`

### Deploy options

**Option A: Cloudflare Pages (recommended for easiest workflow)**

* Create a Pages project
* Connect to GitHub (best) OR upload build output
* Build command: `npm run build`
* Output directory: `dist`

**Option B: Upload static files**

* Use “Upload your static files”
* Upload the **contents** of `dist/`

---

## Backend plan (later): Supabase

### Goals

* Auth + roles: `admin`, `staff`, `guest`
* Persist:

  * Cards and their content
  * Favorites per user
  * Recently viewed per user
  * Change log entries

### Suggested data model (high-level)

* `users` (or use Supabase auth + a profile table)
* `kb_topics`
* `kb_sections`
* `kb_subsections`
* `favorites`
* `recent_views`
* `kb_changes`

### Editing + change tracking

* Only staff/admin can edit.
* Every save writes to `kb_changes` with:

  * who
  * when
  * what topic
  * before/after snapshot or diff

---

## Immediate next steps (recommended)

1. Move the working KB component into your Vite project (`src/App.jsx` or `src/components/...`).
2. Confirm alias + Tailwind are set correctly.
3. Put the project in Git (GitHub) so Cloudflare Pages can auto-deploy.
4. Deploy to Cloudflare Pages.
5. After it’s live, wire Supabase:

   * auth (magic link for staff/admin if you want)
   * “guest” shared login or restricted access
   * database tables

---

## Notes about your current workflow

You built the UI in ChatGPT, then moved to VS Code. That’s fine.

Best practice going forward:

* Keep source of truth in VS Code
* Use Git commits as checkpoints
* Use ChatGPT to:

  * generate components
  * refactor
  * debug errors
  * plan schema + queries

---

## If something breaks

### “Missing script: dev”

You’re not in the project folder.

* Run:

```bash
dir
```

(or `ls`)

* Confirm you see `package.json`.

### “Cannot find module '@/...’”

Alias isn’t set or file paths don’t exist.

* Confirm `vite.config.js` has the alias.
* Confirm the imported path exists under `src/`.

### Tailwind not applying

* Confirm `src/index.css` has the 3 `@tailwind` lines.
* Confirm `tailwind.config.*` has the correct `content` paths.
* Restart `npm run dev`.
