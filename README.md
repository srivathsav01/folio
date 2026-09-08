# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.

## Configuration

Every editable value — links, resume path, availability status, base path — lives
in `.env` at the repo root. Nothing in `src/` hardcodes them; `src/site.js` reads
the whole set and exposes it to the components. `.env.example` documents each key.

| Key | What it controls |
| --- | --- |
| `VITE_SITE_TITLE` | Browser tab title (`index.html`) |
| `VITE_NAME` / `VITE_ROLE` / `VITE_STACK` / `VITE_LOCATION_NOTE` | Hero copy, and the letter in the 3D wireframe |
| `VITE_GITHUB_URL` / `VITE_LINKEDIN_URL` / `VITE_EMAIL` | Navbar icons — an empty value hides that icon |
| `VITE_RESUME_URL` / `VITE_RESUME_FILENAME` | Resume download (file lives in `public/`) |
| `VITE_OPEN_TO_WORK` / `VITE_OPEN_TO_WORK_LABEL` | The pulsing beacon in the dock |
| `VITE_FOOTER_STATUS` | Availability line in the footer |
| `VITE_SHOW_BLOG` | Blog entry in the dock and its route |
| `VITE_BASE_PATH` | `/` for a root deploy, `/<repo>/` for GitHub Pages |

Values are inlined at build time, so restart `npm run dev` (or redeploy) after a
change. Hosts like Vercel, Netlify and Cloudflare Pages can set the same `VITE_*`
keys in their dashboard instead of committing them.
