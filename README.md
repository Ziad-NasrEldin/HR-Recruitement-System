# HR Recruitment System

A recruiter CRM for moving candidates from a Facebook group post to a paid commission — without losing the thread in a spreadsheet.

Built for recruiting desks that source BPO and similar roles, screen voice notes, and get paid when a hire sticks.

- Track leads through sourced, interviewed, in training, and commission paid
- Keep job offers (salary, shift, work model, commission) next to the people you send
- Score voice notes with AI language assessment, then approve or reject
- Generate Facebook posts and run campaigns against a group list
- See pipeline and commission analytics, in English or Arabic (also German and French)

The GitHub repo is named HR-Recruitement-System (historical spelling). The product name is HR Recruitment System.

## Run locally

Needs Node.js 22.12+, the node package manager, and PostgreSQL. There is no public site on this repo.

```bash
cp .env.example .env
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits go to login; a signed-in user lands on the dashboard.

Env keys, seed admin, and the module map live in [`docs/local-setup.md`](docs/local-setup.md).

## How it works

Next.js 16 + NextAuth, Prisma on PostgreSQL, and next-intl for RTL Arabic. Recruiters own leads; super-admins also get post generation, campaigns, Facebook groups, and user settings. Voice notes store a transcription and an English-level score when assessment is run.

---

Built by [Ziad Ahmed](https://github.com/Ziad-NasrEldin) at [MaVoid](https://mavoid.com).

[Website](https://mavoid.com) · [LinkedIn](https://linkedin.com/in/ziad-ahmed-634202332) · [GitHub](https://github.com/Ziad-NasrEldin)
