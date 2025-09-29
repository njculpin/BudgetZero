# Workshop Platform Development Framework

## Strategic Overview

Workshop is a collaborative tabletop game publishing platform focused on creator onboarding, cross-creator collaboration, and marketplace-driven revenue sharing. This document tracks our development priorities and strategic decisions.

## Core Value Proposition

- **Creator Onboarding**: Seamless capability showcasing (illustration, game design, 3D modeling, graphic design)
- **Project Creation**: Collaborative workspace for multi-disciplinary teams
- **Cross-Creator Collaboration**: Network effects through project combinations
- **Marketplace Revenue**: Automatic usage rights and revenue distribution
- **Platform Network Effects**: Exponential value growth through creator-to-creator interactions

## Development Phases Status

### Phase 0: Foundation ✅ COMPLETE

- Supabase Local Development
- Next.js 15 + TypeScript setup
- Authentication system
- Basic project structure

### Phase 1: Game Projects 🚧 95% COMPLETE

**Status**: Core features complete, critical gaps identified

**Completed**:
- ✅ Project CRUD operations
- ✅ TipTap rich text editor with auto-save
- ✅ Project settings (delete/archive)
- ✅ Flexible tag system (1-10 tags per project)
- ✅ User authentication and permissions

**Critical Gaps**:
- 🚨 Project discovery/browse functionality (BLOCKER for network effects)
- 🚨 Email notifications for collaboration (BLOCKER for engagement)
- 🔄 End-to-end collaboration testing needed

### Phase 2: Model Projects 📋 PLANNED

- 3D model upload and management
- STL/OBJ file handling
- Model categorization and preview
- Terms of use for models

### Phase 3: Illustration Projects 📋 PLANNED

- Illustration upload and management
- Image categorization and tagging
- Terms of use for artwork

### Phase 4: Cross-Project Collaboration 🚧 85% COMPLETE (Infrastructure)

**Status**: Complete infrastructure, awaiting validation and email integration

**Completed Infrastructure**:
- ✅ Database schema (project_relationships, project_merge_proposals, project_collaborators)
- ✅ Service layer (ProjectRelationshipService with full CRUD)
- ✅ Server actions (invite, respond, propose merge, execute merge)
- ✅ UI components (InviteCollaboratorDialog, ProposeProjectMergeDialog)
- ✅ Collaboration dashboard (/dashboard) with pending invites/proposals
- ✅ Automatic revenue split calculation
- ✅ Multi-party approval workflow
- ✅ Auto-creation of merged projects with co-ownership

**Critical Gaps**:
- 🚨 End-to-end workflow testing (BLOCKER - not validated)
- 🚨 Email notifications (BLOCKER for user engagement)
- 🔄 Project relationship visualization (nice-to-have)

### Phase 5: Marketplace 📋 PLANNED

- Public marketplace listing
- Sales and revenue distribution
- Payment processing integration
- Digital asset delivery

## Current User Journey Analysis

**Existing Flow**:

1. Creator Signup ✅
2. Profile Setup ✅
3. Game Project Creation ✅
4. Rulebook Editing ✅
5. **[MISSING]** Project Discovery/Browse 🚨
6. Collaboration Invitation ✅ (untested)
7. **[MISSING]** Email Notifications 🚨
8. Dashboard for Invites/Proposals ✅
9. Project Merge Proposals ✅ (untested)
10. Merged Project Creation ✅ (untested)
11. [Future: Asset Integration]
12. [Future: Marketplace Publishing]

**Critical Gaps Blocking Network Effects**:

1. **Project Discovery** (HIGHEST PRIORITY): Without browse/search, creators cannot find each other or discover collaboration opportunities. This breaks the network effects loop entirely.

2. **Email Notifications** (HIGH PRIORITY): Without notifications, creators don't know when they're invited or when proposals are accepted. This creates a dead collaboration workflow.

3. **Workflow Validation** (HIGH PRIORITY): Extensive collaboration infrastructure built but never tested end-to-end. Risk of bugs in production.

4. **Asset Management** (MEDIUM PRIORITY): No way for designers to use modelers' work in their projects. Core value proposition incomplete.

## Strategic Framework for Feature Prioritization

### 1. User Journey Strengthening

Priority: **Strengthen weakest links in the creator journey**

- Current weak points: Collaboration features, asset integration

### 2. Network Effects Multiplier

Priority: **Features that increase creator-to-creator interactions**

- Cross-project collaboration tools
- Asset sharing and remixing
- Creator discovery and connection

### 3. Marketplace Readiness

Priority: **Revenue-enabling capabilities**

- Digital asset management
- Usage rights and licensing
- Payment processing foundation

### 4. Creator Retention

Priority: **Features that keep creators engaged**

- Collaboration tools
- Revenue sharing transparency
- Portfolio and reputation building

## Decision Framework

For each feature request, evaluate:

1. **Journey Impact**: Does this strengthen a weak link in the creator journey?
2. **Network Effects**: Does this increase creator-to-creator interactions?
3. **Revenue Enablement**: Does this support the revenue sharing mechanism?
4. **Technical Foundation**: Is this required for future features?
5. **Competitive Advantage**: Does this leverage our collaborative differentiation?

### Effort Classification

- **Small**: < 1 week implementation
- **Medium**: 1-4 weeks implementation
- **Large**: > 4 weeks implementation

### Priority Matrix

- **High**: Critical for current phase completion or enables next phase
- **Medium**: Valuable but not blocking progress
- **Low**: Nice-to-have, can be deferred

## Current Development Context

**Tech Stack**: Next.js 15, TypeScript, Supabase, TipTap, ShadCN/UI, Tailwind CSS
**Team**: Single developer
**Current Phase**: Completing Phase 1 and validating Phase 4 infrastructure

## Immediate Action Plan (Next 4-6 hours)

### Priority 1: Validate Collaboration Workflow (30 min - 1 hour)
**Effort**: Small | **Impact**: CRITICAL | **Risk**: Blocker

Test the complete collaboration flow end-to-end:
- Create two test user accounts
- Test invitation acceptance/decline
- Test merge proposal workflow
- Test auto-creation of merged projects
- Document bugs and UX friction

**Why Now**: Extensive infrastructure built without validation. This is a critical blocker.

### Priority 2: Build Project Discovery (3-4 hours)
**Effort**: Medium | **Impact**: CRITICAL | **Risk**: Network effects blocker

Enhance `/browse` page with:
- Tag-based filtering
- Search by title/description
- "Looking for Collaborators" flag
- Sort by recent/popular
- Creator profile links

**Why Now**: Without discovery, creators cannot find each other. This breaks the core network effects loop. Discovery enables: Creator Signup → Browse Projects → Find Collaborators → Initiate Collaboration.

### Priority 3: Email Notifications (2-3 hours)
**Effort**: Small-Medium | **Impact**: HIGH | **Risk**: Engagement blocker

Integrate email service (Resend recommended):
- Collaboration invitation emails
- Merge proposal notifications
- Acceptance/decline confirmations
- Template system for future emails

**Why Now**: Completes the collaboration feedback loop. Without notifications, users don't know about invites/proposals.

## Medium-term Priorities (Next 2-3 days)

### Priority 4: Asset Management Foundation (8-12 hours)
**Effort**: Large | **Impact**: HIGH | **Risk**: Core value prop incomplete

- Supabase Storage setup for files
- Asset upload UI (3D models, illustrations)
- Asset browser and preview
- Basic asset usage rights system
- Link assets to projects

**Why Now**: Core value proposition is "designers use modelers' work." Without asset management, this doesn't work.

### Priority 5: User Profiles & Portfolios (4-6 hours)
**Effort**: Medium | **Impact**: MEDIUM | **Risk**: Discovery incomplete

- Public profile pages
- Capability showcase (roles, skills)
- Project portfolio display
- Social proof indicators

**Why Now**: Supports project discovery and builds creator reputation.

## Deferred Features (Phase 6+)

**Sync Blocks** (Deferred to Phase 6):
- Rationale: Quality-of-life feature for single-user editing
- Impact: LOW on network effects
- Decision: Complete core collaboration workflow first

**Design Principles System** (Deferred to Phase 6):
- Rationale: Project management polish feature
- Impact: LOW on creator engagement
- Decision: Focus on discovery and collaboration first

**Real-time Collaboration (Yjs)** (Deferred to Phase 6):
- Rationale: Complex implementation, nice-to-have
- Impact: MEDIUM on user experience
- Decision: Async collaboration works for now

## Key Architectural Decisions Needed

- Email service selection (Recommendation: Resend for Next.js integration)
- Asset storage strategy (Recommendation: Supabase Storage with CDN)
- Discovery algorithm (tags vs. full-text search)
- Revenue tracking infrastructure (Phase 5)

## Success Metrics by Phase

**Phase 1 Success**:

- Complete rulebook creation workflow
- Basic project management
- User onboarding completion rate >70%

**Phase 2-3 Success**:

- Multi-creator project adoption
- Asset upload and usage rates
- Creator cross-pollination metrics

**Phase 4-5 Success**:

- Revenue sharing transactions
- Marketplace conversion rates
- Creator retention and growth

---

_Last Updated: 2025-09-29_
_Next Review: After collaboration workflow validation and project discovery implementation_

## Recent Accomplishments (2025-09-29)

### Database & Collaboration Infrastructure
- Created complete project_relationships table with RLS policies
- Created project_merge_proposals table with approval workflow
- Verified project_collaborators table from initial schema
- Applied all migrations successfully to local Supabase

### Collaboration Features
- Built complete ProjectRelationshipService with full CRUD operations
- Implemented all collaboration server actions (invite, respond, propose, merge)
- Created InviteCollaboratorDialog component
- Created ProposeProjectMergeDialog component
- Built /dashboard page with pending invites and merge proposals
- Implemented automatic revenue split calculation
- Added multi-party approval workflow for merges
- Auto-creation of merged projects with co-ownership

### UI Improvements
- Replaced rigid categories with flexible tag system (1-10 tags)
- Added suggested tags for quick selection
- Custom tag creation for organic growth
- Project settings with delete/archive functionality

### Critical Next Steps
1. Validate collaboration workflow end-to-end
2. Build project discovery/browse functionality
3. Implement email notifications
4. Begin asset management foundation
