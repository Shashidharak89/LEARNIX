<!--
	Learnix - Project README
	A friendly, well-structured overview for contributors and users.
-->

# Learnix

Learnix is a lightweight learning-content sharing and collaboration platform built with Next.js, React and MongoDB. It focuses on easy uploads, searchable study materials, and a small activity feed called "Updates" so contributors and students can stay informed.

Demo: (run locally) — see **Quick Start** below.

---

<!-- Visual tech badges -->

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](#) [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#) [![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#) [![Mongoose](https://img.shields.io/badge/Mongoose-7F56D9?style=for-the-badge)](#) [![Cloudinary](https://img.shields.io/badge/Cloudinary-4000FF?style=for-the-badge)](#)


**Key Concepts & Highlights**

- **Upload & Works**: Students and contributors can upload works (notes, PDFs, question papers) and manage subjects/topics.
- **Study Materials**: Curated materials and question papers organized by subject.
- **TextShare Tool**: Small in-browser editor for creating and saving short text snippets (My Codes/localStorage support).
- **Chunked Upload (frontend)**: A client-side chunked uploader (100KB chunks) to handle large files more reliably.
- **Updates Activity Feed**: Create/read/edit/delete short updates to announce new materials or changes.
- **Notifications & Reviews**: In-app notifications and review flows for works and submissions.

---

**Tech Stack**

- Next.js (App Router)
- React (Client components)
- MongoDB (via Mongoose)
- Cloudinary (media hosting integration)
- Plain CSS modules under `src/app/.../styles`

---

**Repository Overview**

- `src/app/` — All Next.js pages and client components
- `src/app/api/` — Next.js API routes (Mongoose + business logic)
- `src/models/` — Mongoose models (User, Work, Update, etc.)
- `src/lib/` — Helpers (Cloudinary, DB connection, utils)
- `public/` — Static assets

---

**Sidebar Navigation (Available Routes)**

These are the primary navigation routes shown in the left sidebar of the app. Use them to explore the app when running locally:

- `/dashboard` — Dashboard (home for authenticated users)
- `/login` — Login / Register
- `/search` — Search (users, works, topics)
- `/learn` — Learn (structured study content)
- `/works` — Uploaded Works (browse uploaded student works)
- `/upload` — Upload (add new subjects/topics/works; includes Updates banner)
	- `/upload/updates` — Manage Updates (create / edit / delete updates)
- `/materials` — Study Materials
- `/qp` — Question Papers
- `/tools` — Tools (TextShare, WordToPdf, converters)
- `/feedback` — User Feedback form
- `/help` — Help & Guides
- `/about` — About the project
- `/profile` — User Profile (change name/password, profile image)

Tip: the sidebar shows or hides items based on authentication state (localStorage USN).

---

**Important Features (Detailed)**

- Updates: A small activity feed to announce new topics, created subjects, or admin messages. Backed by a Mongoose `Update` model and API endpoints: `GET /api/updates`, `POST /api/updates`, `POST /api/updates/edit`, `POST /api/updates/delete`.
- Chunked Upload (frontend): `src/app/test/ChunkUploader.js` demonstrates splitting large files into 100KB chunks; backend endpoints for chunk merge/upload are TODO.
- TextShare: lightweight editor with localStorage support, 'My Codes' saving, and full-screen editing with keyboard shortcuts.

---

**Quick Start (development)**

1. Install dependencies

```bash
npm install
```

2. Configure environment

- Copy `.env.example` (if present) to `.env` and set MongoDB URI, Cloudinary keys and other secrets.

3. Run the dev server

```bash
npm run dev
```

4. Open in browser

Visit `http://localhost:3000`

---

**Useful NPM Scripts**

- `npm run dev` — Start Next.js in development
- `npm run build` — Build for production
- `npm run start` — Start production server (after build)

---

**Developer Notes**

- Auth model currently relies on a localStorage `usn` value to resolve a server-side `userId` through `GET /api/user/id?usn=`. Consider adding JWT/session-based auth for production.
- Chunked upload backend endpoints are planned but not yet implemented. Frontend chunk splitting exists.
- Form styling and components use standard CSS files under `src/app/.../styles`. A recent addition: `AddUpdateForm.css` (for the Updates manager) — ensure `AddUpdateForm.js` imports it.

---

**Tags**

<!-- Tag cloud (badge style) -->

[![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](#) [![React](https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black)](#)

[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](#) [![Mongoose](https://img.shields.io/badge/Mongoose-7F56D9?style=for-the-badge)](#)

[![Cloudinary](https://img.shields.io/badge/Cloudinary-4000FF?style=for-the-badge)](#) [![Chunked Upload](https://img.shields.io/badge/Chunked--Upload-00aaff?style=for-the-badge)](#)

[![TextShare](https://img.shields.io/badge/TextShare-ffb86b?style=for-the-badge)](#) [![Updates](https://img.shields.io/badge/Updates-f97316?style=for-the-badge)](#) [![StudyMaterials](https://img.shields.io/badge/StudyMaterials-8b5cf6?style=for-the-badge)](#)


---

**Contributing**

- Fork the project, create a feature branch, and send a PR. Include clear descriptions for feature additions or bug fixes.
- Run the dev server and ensure style and linting are consistent with the existing code.

---

**License**

This repository does not include a license file by default. Add one (for example, MIT) if you want to make the project explicitly open-source.

---

If you'd like, I can also:

- Generate a fully styled HTML README in `docs/` so you can open it in a browser.
- Add badges for build status or dependencies.

Happy hacking — ask me to run tests, format code, or generate the browsable HTML README.
