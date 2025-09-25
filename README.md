This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Tabletop Creator Marketplace - Platform Specification

## Platform Overview
- Collaborative marketplace for tabletop creators.
- Roles:
  - Designer: Upload rulesets, mechanics, expansions.
  - Illustrator: Upload art, covers, boards, assets.
  - 3D Modeler: Upload miniatures, terrain, STL files.
  - Editor/Writer/Graphic Designer: Contribute text, layout, and polish.
- Contributions combined into Artifacts (games, expansions, editions).
  - Artifacts can be forked/remixed.
  - Contributors share revenue automatically.
  - Marketplace supports non-exclusive, compounding creativity.

## Contribution Model
### Types
- Rulesets: Mechanics, full games, expansions.
- Art: Illustrations, covers, icons, UI.
- 3D Models: Miniatures, tokens, boards, STL packs.
- Editing/Design: Rules editing, layout, graphic design.

### Licensing Options
1. Approval Required: Contributor must approve usage.
2. Open (Platform Only): Any creator can remix on-platform; external use prohibited.
3. Exclusive/For Sale: Revenue-sharing or paid license only.

## Project & Artifact Structure
- Project: Collaborative container.
  - Roles: Designer, Illustrator, Modeler, Editor (flexible).
  - Access: Invite-only or open.
  - Contributors accept auto-generated agreement.
- Artifact: Sellable version of a project.
  - Can be forked/remixed.
  - Revenue shared among contributors.
- Example:
  - Project A: Joe (Designer) + Molly (Modeler) + Alice (Illustrator)
  - Artifact A1: Published game (Alice’s art)
  - Artifact A2: Fork (Olivia’s art)
  - Both generate revenue independently.

## Sales Model
- Digital: PDFs, zips, downloads. Fees: Stripe 2–3%, Platform 2–3%.
- Physical (future): Print-on-demand; print/shipping costs deducted.
- Revenue split evenly among contributors.

## Payouts
- Monthly via Stripe Connect; $10 minimum.
- Transparency: Sales count, gross revenue, fees, contributor share, pending/next payout.
- Statements auto-generated for accounting/taxes.

## Discovery & Recommendations
- Link artifact forks/variants.
- Highlight top sellers, trending forks.
- Filters by contributor role, license, popularity, tags.
- Contributor profiles show history, sales, collaborations.

## Contributor Agreement (Auto-generated)
- Revenue split equal among contributors.
- Monthly payouts.
- Withdrawal rights: remove asset; past revenue unaffected.
- Licensing enforced per contribution.
- Non-exclusivity unless upgraded.

## Governance & Quality
- Invite-only phase for curated creators.
- Community curation via ratings, reviews, reputation.
- Anti-spam: Upload limits, duplicate/artifact detection.

## Platform Revenue
- Fees: Stripe 2–3%, Platform 2–3% (~5% total).
- Optional add-ons: Featured listings, exclusive licensing, print-on-demand.

## Principles
- Simplicity: Clear, even splits.
- Transparency: Fees and revenue visible.
- Flexibility: Contributor control over licensing and withdrawal.
- Trust: Auto-generated agreements.
- Scalability: Digital-first, expandable.

## Editor & Asset Management System
- Core Editors:
  - Rulebook Editor (TipTap): Structured sections, headings, tables, context boxes, inline linking, PDF preview, collaborative editing.
  - Illustration Asset Manager: Upload, categorize, tag, preview, embed images; version control.
  - 3D Model Asset Manager: Upload STL/OBJ, categorize, preview, assign to rules.
  - Rules Editing & Polishing: Context boxes, inline comments, section forking.
- Context Boxes: Reusable blocks; auto-sync across rulebook; support text, images, models.
- UX Principles: Notion-like, modular, collaboration-ready, asset-driven.
- Tech Stack: React 18 + TS, TipTap 3, Supabase, TanStack Query, React DnD, html2canvas + jsPDF, Stripe JS, Vite + SWC, TailwindCSS + ShadeCN. Leverage https://supabase.com/ui/docs/getting-started/introduction real time cursor, chat, auth, avatar stack.
- Workflow Example:
  1. Designer creates rulebook.
  2. Illustrator uploads artwork.
  3. Designer embeds artwork/context boxes.
  4. Modeler uploads 3D assets.
  5. Artifact published; revenue auto-split.
  6. Updates can fork new artifacts.

## Extended Platform Features
- Collaboration & Permissions:
  - Roles: Designer, Illustrator, 3D Modeler, Editor/Writer/Designer, Admin/Moderator.
  - Editing permissions: per project; commenting and suggestions without full edits.
  - Version history & rollback; forks traceable.
- Artifact Lifecycle:
  - Forking: Create new versions without affecting originals.
  - Snapshots/Releases: Lock artifact for sales, licensing, print.
- Licensing & Rights:
  - Contributors can withdraw assets; past sales unaffected.
  - License types: Platform-non-exclusive by default; optional premium/exclusive.
  - Track derivative works.
- Discovery & Marketplace:
  - Artifact listings with roles, licenses, versions.
  - Recommendations: forks, updates, complementary assets.
  - Search & filters: contributor, license, popularity, tags.
  - Reputation system: tracks history, sales, collaborations.
- Export & Print:
  - PDF export: rulebooks and instructions.
  - Image export: standalone or embedded.
  - Print-on-demand integration for snapshots.
- Metrics & Dashboards:
  - Contributor dashboard: sales, revenue, downloads, pending payouts.
  - Project activity: edits, forks, contributions, notifications.
- Onboarding & Invite System:
  - Invite-only early access for curated creators.
  - Contributor profiles: skills, artifact history, reputation.


