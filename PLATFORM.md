# Tabletop Creator Marketplace  
*Platform Structure & Operating Model*  

---

## 1. Platform Overview  

A collaborative marketplace for tabletop creators:  
- **Designers** upload rulesets, mechanics, expansions.  
- **Illustrators** upload art, covers, boards, assets.  
- **3D Modelers** upload miniatures, terrain, STL files.  
- **Editors / Writers / Graphic Designers** contribute polishing work.  

Contributions combine into **Artifacts** (games, expansions, editions).  
- Artifacts can be **forked/remixed** into new versions.  
- Contributors automatically share in revenue.  
- Marketplace fosters **non-exclusive, compounding creativity**.  

---

## 2. Contribution Model  

### Contribution Types  
- **Rulesets** – mechanics, full games, expansions.  
- **Art** – illustrations, covers, icons, UI.  
- **3D Models** – miniatures, tokens, boards, STL packs.  
- **Editing/Design** – rules editing, layout, graphic design.  

### Licensing Options  
Each contribution is uploaded with a license setting:  

1. **Approval Required**  
   - Contributor must approve before use in a project.  

2. **Open (Platform-Only)**  
   - Any creator may remix and combine freely inside the platform.  
   - External use prohibited without permission.  

3. **Exclusive / For Sale**  
   - Contribution only available under revenue-sharing or purchase/license.  

---

## 3. Project & Artifact Structure  

### Project  
- A **container** where contributors collaborate.  
- Roles: Designer, Illustrator, Modeler, Editor (flexible & expandable).  
- Contributors accept auto-generated agreement (see §7).  
- May be **invite-only** (controlled collaboration) or **open** (anyone can propose forks).  

### Artifact  
- A **sellable version** of a project (digital game, PnP files, STL set, expansion).  
- Can be forked/remixed into new artifacts.  
- Contributors receive revenue from each artifact they are part of.  

### Example  
- **Project A:** Designer Joe + Modeler Molly + Illustrator Alice.  
- **Artifact A1:** Published game with Alice’s art.  
- **Artifact A2:** Fork with Olivia’s art instead of Alice.  
- Both coexist, both generate revenue for their contributors.  

---

## 4. Sales Model  

### Digital Sales (Default)  
- Sold as PDFs, zips, or digital downloads.  
- Fees deducted:  
  - Stripe ~2–3%  
  - Platform ~2–3%  
- Net revenue split evenly among contributors.  

**Example ($10 sale, 3 contributors):**  
- Buyer pays: $10  
- Stripe: $0.30 (3%)  
- Platform: $0.20 (2%)  
- Pool: $9.50  
- Each contributor: $3.17  

### Physical Sales (Future Expansion)  
- Partner print-on-demand network.  
- Print/shipping costs deducted before splits.  

**Example ($40 sale, $12 print cost, 3 contributors):**  
- Buyer pays: $40  
- Print cost: $12  
- Stripe: $0.84 (3%)  
- Platform: $0.56 (2%)  
- Pool: $26.60  
- Each contributor: $8.87  

---

## 5. Payouts  

- **Frequency:** Monthly (e.g., 1st of each month).  
- **Minimum Threshold:** $10 (balances roll over until met).  
- **Method:** Stripe Connect (global payouts, tax compliance).  
- **Transparency:**  
  - Sales count  
  - Gross revenue  
  - Fees & deductions  
  - Contributor share  
  - Pending/next payout date  
- **Statements:** Auto-generated monthly for accounting & taxes.  

---

## 6. Discovery & Recommendations  

- **Other Versions**: Artifact pages link to forks/variants (e.g., Alice’s vs. Olivia’s version).  
- **Recommendations:** Highlight top sellers, trending variants, recent forks.  
- **Filters:** By contributor role, license type, popularity, or tag.  
- **Reputation:** Contributor profiles show history, sales, collaborations.  

---

## 7. Auto-Generated Contributor Agreement  

When a project artifact is published, the platform generates an agreement:  

- **Revenue Split:** Equal among contributors.  
- **Payouts:** Monthly via Stripe Connect, $10 minimum.  
- **Withdrawal Rights:** Contributors may remove their asset anytime (removes future sales but not past-earned revenue).  
- **Licensing:** Contribution governed by selected license (Approval, Open, Exclusive).  
- **Non-Exclusivity:** No artifact is exclusive unless a licensing upgrade is negotiated.  

Contributors must accept before publication.  

---

## 8. Governance & Quality  

- **Invite-Only Phase (Early Access):**  
  - Keep creator pool curated for quality.  
- **Community Curation:**  
  - Ratings, reviews, reputation scores.  
- **Anti-Spam Measures:**  
  - Limits on uploads per week.  
  - Automated duplicate/artifact checks.  

---

## 9. Platform Revenue Model  

- **Fees:**  
  - Stripe: 2–3% (payment processor).  
  - Platform: 2–3% (maintenance, hosting, growth).  
- **Total Take:** ~5% per transaction (vs. 30–50% on other marketplaces).  
- **Future Add-Ons:**  
  - Featured listings (optional paid promo).  
  - Exclusive licensing services (premium).  
  - Print-on-demand partnerships.  

---

## 10. Key Principles  

- **Simplicity:** Even splits, clear rules, no negotiation overhead.  
- **Transparency:** All fees & splits visible in dashboards.  
- **Flexibility:** Creators control licensing & withdrawal rights.  
- **Trust:** Agreements auto-generated, disputes minimized.  
- **Scalability:** Digital-first, expandable to print & hybrid models.


# Tabletop Creator Platform: Editor & Asset Management System

This document outlines the **on-platform content creation and asset management system**, designed for tabletop game creators. The goal is to provide a **flexible, Notion-like interface** that simplifies collaboration while supporting complex project structures.

---

## 1. Core Platform Editors

### 1.1 Rulebook Editor
- Rich text editor based on **TipTap**.
- Supports:
  - Structured sections, headings, and tables.
  - **Context boxes**: reusable text blocks that can be repeated throughout the rulebook to reinforce rules or mechanics.
  - Inline linking between rules, illustrations, or models.
- Features:
  - Drag-and-drop ordering of sections.
  - Live preview of PDF/print layout.
  - Collaborative editing with version history.
- Tech Highlights:
  - `@tiptap/react` + extensions (`table`, `image`, `color`, `text-style`, `text-align`).
  - React + TypeScript frontend with real-time updates.

---

### 1.2 Illustration Asset Manager
- Manages all visual assets for a project.
- Supports:
  - Upload, categorize, and tag images.
  - Preview and embed images directly into the rulebook.
  - Version control for updated illustrations.
- Tech Highlights:
  - React-based drag-and-drop uploader.
  - Integration with Supabase storage and authentication.
  - Inline embedding in TipTap editor for immediate visual feedback.

---

### 1.3 3D Model Asset Manager
- Handles miniature and 3D assets (STL, OBJ, or other supported formats).
- Features:
  - Upload, categorize, and tag models.
  - Preview thumbnails and 3D viewer for supported formats.
  - Associate models with specific game rules or contexts in the rulebook.
- Tech Highlights:
  - Uses React + custom 3D viewers (e.g., Three.js can be integrated).
  - Supabase storage for file hosting and access control.
  - Drag-and-drop assignment to game artifacts.

---

### 1.4 Rules Editing & Content Polishing
- Dedicated editor for text refinements, rule balancing, and formatting.
- Supports:
  - Context boxes (reusable blocks).
  - Inline comments and suggestions.
  - Forking sections for collaborative experimentation.
- Ensures high-quality, polished final artifacts.

---

## 2. Context Boxes in Rulebook
- Purpose:
  - Reinforce rules by repeating key information across multiple sections.
  - Reduce redundancy while maintaining clarity.
- Features:
  - Drag context box anywhere in the rulebook.
  - Auto-sync updates: changing a context box updates all instances across the rulebook.
  - Can include text, images, or linked model assets.

---

## 3. User Experience Principles
- **Notion-like simplicity**: clean, block-based editor interface.
- **Flexible modularity**: contributors can mix/match rules, art, and models.
- **Collaboration-ready**: multiple contributors per artifact with version history.
- **Asset-driven design**: all content (rules, images, models) can be referenced and reused easily.

---

## 4. Tech Stack Alignment
- Frontend: React 18 + TypeScript
- Editors: TipTap 3 with extensions for tables, text styling, links, images, and colors
- State & Data: TanStack React Query, Supabase for storage, auth, and real-time updates
- 3D Assets: React DnD + custom viewer integrations
- PDF/Export: html2canvas + jsPDF for print-ready outputs
- Payments & Sales: Stripe JS + React Stripe JS
- Build/Dev: Vite with SWC plugin, ESLint + TypeScript

---

## 5. Workflow Example
1. Designer Joe creates a new rulebook in the **Rulebook Editor**.
2. Illustrator Alice uploads artwork to the **Illustration Asset Manager**.
3. Joe embeds Alice’s illustrations and reusable **context boxes** in the rulebook.
4. 3D Modeler Molly uploads STL files in the **3D Model Asset Manager**.
5. The artifact is published: all contributors receive even-split revenue automatically.
6. Updates to rules or assets can be forked for new artifact versions.

---

## 6. Goals
- Provide an intuitive, single interface for tabletop game creation.
- Enable modular, reusable contributions across multiple projects.
- Make collaboration seamless while maintaining version control and contributor rights.
- Facilitate digital-first publishing with potential future integration for print-on-demand.

# Tabletop Creator Platform: Editor & Asset Management System

This document outlines the **on-platform content creation and asset management system**, designed for tabletop game creators. The goal is to provide a **flexible, Notion-like interface** that simplifies collaboration while supporting complex project structures.

---

## 1. Core Platform Editors

### 1.1 Rulebook Editor
- Rich text editor based on **TipTap**.
- Supports:
  - Structured sections, headings, and tables.
  - **Context boxes**: reusable text blocks that can be repeated throughout the rulebook to reinforce rules or mechanics.
  - Inline linking between rules, illustrations, or models.
- Features:
  - Drag-and-drop ordering of sections.
  - Live preview of PDF/print layout.
  - Collaborative editing with version history.
- Tech Highlights:
  - `@tiptap/react` + extensions (`table`, `image`, `color`, `text-style`, `text-align`).
  - React + TypeScript frontend with real-time updates.

---

### 1.2 Illustration Asset Manager
- Manages all visual assets for a project.
- Supports:
  - Upload, categorize, and tag images.
  - Preview and embed images directly into the rulebook.
  - Version control for updated illustrations.
- Tech Highlights:
  - React-based drag-and-drop uploader.
  - Integration with Supabase storage and authentication.
  - Inline embedding in TipTap editor for immediate visual feedback.

---

### 1.3 3D Model Asset Manager
- Handles miniature and 3D assets (STL, OBJ, or other supported formats).
- Features:
  - Upload, categorize, and tag models.
  - Preview thumbnails and 3D viewer for supported formats.
  - Associate models with specific game rules or contexts in the rulebook.
- Tech Highlights:
  - Uses React + custom 3D viewers (e.g., Three.js can be integrated).
  - Supabase storage for file hosting and access control.
  - Drag-and-drop assignment to game artifacts.

---

### 1.4 Rules Editing & Content Polishing
- Dedicated editor for text refinements, rule balancing, and formatting.
- Supports:
  - Context boxes (reusable blocks).
  - Inline comments and suggestions.
  - Forking sections for collaborative experimentation.
- Ensures high-quality, polished final artifacts.

---

## 2. Context Boxes in Rulebook
- Purpose:
  - Reinforce rules by repeating key information across multiple sections.
  - Reduce redundancy while maintaining clarity.
- Features:
  - Drag context box anywhere in the rulebook.
  - Auto-sync updates: changing a context box updates all instances across the rulebook.
  - Can include text, images, or linked model assets.

---

## 3. User Experience Principles
- **Notion-like simplicity**: clean, block-based editor interface.
- **Flexible modularity**: contributors can mix/match rules, art, and models.
- **Collaboration-ready**: multiple contributors per artifact with version history.
- **Asset-driven design**: all content (rules, images, models) can be referenced and reused easily.

---

## 4. Tech Stack Alignment
- Frontend: React 18 + TypeScript
- Editors: TipTap 3 with extensions for tables, text styling, links, images, and colors
- State & Data: TanStack React Query, Supabase for storage, auth, and real-time updates
- 3D Assets: React DnD + custom viewer integrations
- PDF/Export: html2canvas + jsPDF for print-ready outputs
- Payments & Sales: Stripe JS + React Stripe JS
- Build/Dev: Vite with SWC plugin, ESLint + TypeScript

---

## 5. Workflow Example
1. Designer Joe creates a new rulebook in the **Rulebook Editor**.
2. Illustrator Alice uploads artwork to the **Illustration Asset Manager**.
3. Joe embeds Alice’s illustrations and reusable **context boxes** in the rulebook.
4. 3D Modeler Molly uploads STL files in the **3D Model Asset Manager**.
5. The artifact is published: all contributors receive even-split revenue automatically.
6. Updates to rules or assets can be forked for new artifact versions.

---

## 6. Goals
- Provide an intuitive, single interface for tabletop game creation.
- Enable modular, reusable contributions across multiple projects.
- Make collaboration seamless while maintaining version control and contributor rights.
- Facilitate digital-first publishing with potential future integration for print-on-demand.

# Tabletop Creator Platform: Extended Platform Design

This document outlines additional platform elements critical to a full-featured collaborative tabletop game marketplace. These are complementary to the editor and asset management system.

---

## 1. Collaboration & Permissions

### 1.1 User Roles
- **Designer** – creates and manages rulesets and core game mechanics.
- **Illustrator** – uploads and manages artwork for projects.
- **3D Modeler** – uploads and manages miniatures and other 3D assets.
- **Editor / Writer / Graphic Designer** – refines text, layout, and visual presentation.
- **Administrator / Moderator** – optional role for project oversight or content curation.

### 1.2 Editing Permissions
- Fine-grained control per project:
  - Who can edit rules, assets, or layout.
  - Ability to comment, suggest, or propose forks without full editing rights.

### 1.3 Commenting & Suggestions
- Inline comments or block-level annotations within:
  - Rulebook editor.
  - Illustration and 3D asset previews.
- Supports collaboration without overwriting original content.

### 1.4 Version History & Rollback
- Every artifact maintains a full edit history.
- Users can revert to previous versions.
- Forks maintain traceability back to the original artifact.

---

## 2. Artifact Lifecycle

### 2.1 Forking & Updates
- Contributors can fork artifacts to create new versions.
- Updates to a fork do not affect the original unless merged manually.
- Allows experimentation and parallel development of similar projects.

### 2.2 Snapshots / Releases
- “Release” or “snapshot” mechanism to lock artifact versions for:
  - Sales.
  - Licensing agreements.
  - Print or distribution readiness.
- Ensures stability for buyers and contributors.

---

## 3. Licensing & Rights

### 3.1 Contributor Rights
- Contributors retain the right to withdraw their content at any time.
- Past sales are unaffected; future sales are removed if withdrawn.

### 3.2 License Types
- Default non-exclusive usage within the platform.
- Optional premium licenses for exclusivity or external distribution.
- Clear attribution automatically maintained across forks and derivative works.

### 3.3 Derivative Works Tracking
- Maintain clear links between original and derived artifacts.
- Supports revenue sharing, contributor recognition, and IP management.

---

## 4. Discovery & Marketplace

### 4.1 Artifact Listings
- Centralized pages for all published artifacts.
- Displays contributor roles, licenses, and versions.
- Shows top-selling or trending artifacts.

### 4.2 Recommendations
- Suggest alternative versions (e.g., same ruleset with different illustrator or modeler).
- Highlight forks, updates, or complementary assets.

### 4.3 Search & Filters
- By contributor type, license, popularity, tags, or project category.

### 4.4 Reputation System
- Tracks contributor history, sales, and collaborations.
- Helps buyers identify trusted creators.

---

## 5. Export & Print Options

### 5.1 PDF Export
- Rulebooks and game instructions exportable to PDF for print or digital use.

### 5.2 Image Export
- Illustrations exportable individually or embedded within rulebooks.

### 5.3 Print-on-Demand Integration
- Optional future integration for physical copies.
- Uses locked “snapshot” versions for consistency in printing.

---

## 6. Metrics & Dashboards

### 6.1 Contributor Dashboard
- Displays:
  - Total sales and revenue per artifact.
  - Download counts and usage stats.
  - Pending payouts and monthly summaries.

### 6.2 Project Activity
- Shows recent edits, forks, and collaborator contributions.
- Notifications for comments, suggestions, or approvals.

---

## 7. Onboarding & Invite System

### 7.1 Invite-Only Phase
- Early access for high-quality creators to maintain platform standards.

### 7.2 Profiles
- Contributor profile with:
  - Skills and roles.
  - Artifact history and performance.
  - Reputation and community endorsements.
