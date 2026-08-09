# Teaching Hub — Netlify version

Syncs across devices using a personal "sync key" instead of a login.
No password recovery — if you lose the key, that data is unrecoverable,
so save it somewhere safe (a password manager is ideal) the moment
you generate it.

## Deploy (one-time setup)

You'll need a free Netlify account: https://app.netlify.com/signup

1. Install the Netlify CLI (needs Node.js installed on your computer):
   ```
   npm install -g netlify-cli
   ```

2. From inside this folder, log in and deploy:
   ```
   netlify login
   netlify init
   ```
   When asked, choose "Create & configure a new site" and accept the
   defaults (publish directory `public`, functions directory
   `netlify/functions` are already set in `netlify.toml`).

3. Deploy it live:
   ```
   netlify deploy --prod
   ```

4. Netlify gives you a URL (e.g. `https://your-site-name.netlify.app`).
   Open it — on first visit it'll ask you to generate a sync key.
   Copy that key into a password manager, then use "Sync" in the nav
   bar to view it again later or switch keys on another device.

## Updating later

If you ask me for changes to the app, I'll give you an updated
`public/index.html` (and/or `netlify/functions/data.js`) — drop the
new file(s) into this folder in place of the old ones, then run
`netlify deploy --prod` again from this folder to publish the update.

## Files

- `public/index.html` — the whole app (planner + resource bank)
- `netlify/functions/data.js` — the sync backend (reads/writes your
  data, namespaced to your sync key, using Netlify Blobs)
- `netlify.toml` — tells Netlify where to find the above
- `package.json` — the one dependency the function needs
