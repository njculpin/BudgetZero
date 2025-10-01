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

### Phase 2: Model Projects ✅ COMPLETE

**Status**: Core features implemented, tags migration complete

**Completed**:
- ✅ 3D model upload and management
- ✅ STL/OBJ file handling via Supabase Storage
- ✅ Flexible tag system (replaced rigid categories)
- ✅ Model-specific fields (polygon count, rigging, textures, game-ready)
- ✅ Browse page with tag filtering (/models)
- ✅ Asset integration into rulebooks (Phase 4.1)
- ✅ Multi-file support (model + textures + materials)
- ✅ Terms of use and licensing

### Phase 3: Illustration Projects 📋 PLANNED

- Illustration upload and management
- Image categorization and tagging
- Terms of use for artwork

### Phase 4: Cross-Project Collaboration ✅ 95% COMPLETE

**Status**: Infrastructure complete, Phase 4.1 & 4.2 production-ready

**Completed Phase 4.1 - Asset Integration**:
- ✅ project_assets table with RLS policies
- ✅ AssetIntegrationService with full CRUD
- ✅ TipTap AssetReference extension
- ✅ Asset picker modal in editor
- ✅ Visual asset cards in rulebooks
- ✅ Creator attribution and notifications
- ✅ License compatibility checks

**Completed Phase 4.2 - Fork & Collaboration**:
- ✅ project_forks table with merge/reference types
- ✅ collaborative_projects with revenue split
- ✅ ForkService and CollaborativeProjectService
- ✅ Project search modal
- ✅ Fork request workflow (send, accept, decline)
- ✅ Multi-party approval system
- ✅ Collaborative project workspace UI
- ✅ License compatibility validation

**Remaining Gaps**:
- 🔄 End-to-end workflow testing (HIGH PRIORITY)
- 🔄 Email notifications enhancement (MEDIUM - basic email service exists)
- 🔄 Cross-type collaboration (game + model + illustration)

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

## STRATEGIC RECOMMENDATION - UPDATED 2025-09-30

### Analysis Summary

**Current State**:
- Phase 1 (Game Projects): 95% complete - core editor working, tags implemented
- Phase 2 (Models): ✅ Complete - upload, browse, tags, asset integration done
- Phase 3 (Illustrations): Not started
- Phase 4 (Collaboration): 95% complete - asset integration, forking, approvals all working
- Phase 5 (Marketplace): Not started

**Critical Gap Identified**: The platform has TWO content types (games + models) with sophisticated collaboration infrastructure, but is missing the DISCOVERY and MARKETPLACE layers that enable the business model.

### RECOMMENDED PRIORITY ORDER

## Priority 1: Complete Phase 3 (Illustration Projects) - 6-8 hours
**Effort**: Medium | **Impact**: CRITICAL | **Risk**: Content diversity blocker

**Rationale**:
- Leverage existing asset infrastructure (95% code reuse from models)
- Minimal effort for maximum content type expansion
- Enables true multi-disciplinary collaboration (games + models + art)
- Differentiates platform from model-only marketplaces

**Implementation**:
- Copy /models structure to /illustrations
- Add illustration-specific fields (dimensions, resolution, format, style tags)
- Reuse tag system, upload flow, browse page
- Update asset picker to include illustrations
- Add illustration category to AssetType filtering

**Why This First**: Quick win that unlocks richer project combinations. A game designer can now use BOTH models AND illustrations, creating more valuable collaborative projects.

## Priority 2: Unified Asset Discovery - 4-6 hours
**Effort**: Medium | **Impact**: HIGH | **Risk**: Network effects incomplete

**Enhancement to existing /browse and /models pages**:
- Unified /browse page for ALL content (games, models, illustrations)
- Type filter (show all, or filter by type)
- "Seeking Collaborators" flag on projects
- Creator profile links
- Sort by: recent, popular, most collaborative
- Enhanced tag filtering across all types

**Why Second**: With 3 content types, discovery becomes critical. Creators need to find compatible projects and assets across disciplines.

## Priority 3: End-to-End Collaboration Testing - 2-3 hours
**Effort**: Small | **Impact**: CRITICAL | **Risk**: Quality blocker

**Validation Workflow**:
- Create 3 test accounts (designer, modeler, illustrator)
- Test asset integration (add model to game, add illustration to game)
- Test fork requests (game + model merge)
- Test multi-project collaboration (game + model + illustration)
- Test approval workflow and revenue splits
- Document bugs and UX issues

**Why Third**: Validate the collaboration infrastructure works end-to-end before marketplace launch.

## Priority 4: Phase 5 Marketplace Foundation - 12-16 hours
**Effort**: Large | **Impact**: CRITICAL | **Risk**: Revenue blocker

**Core Marketplace Features**:
- Public marketplace page (/marketplace)
- Published project listings
- Purchase flow (Stripe integration)
- Digital asset delivery
- Revenue distribution tracking
- Download management
- License enforcement

**Why Fourth**: With 3 content types and validated collaboration, marketplace becomes the revenue engine. This is THE critical business model enabler.

## Deferred Priorities

### User Profiles & Portfolios - DEFER to Phase 6
**Rationale**: Browse pages already show creator names. Full profiles are enhancement, not blocker.

### Email Notification Enhancement - DEFER to Phase 6
**Rationale**: Basic email service exists (lib/services/email.ts). Collaboration works without immediate emails. Add after marketplace.

### Phase 3 Illustrations Alt: Complete Marketplace First
**Alternative Strategy**: Skip illustrations, go straight to marketplace with games + models only. Add illustrations post-MVP.
**Risk**: Less differentiation, smaller network effects, less valuable collaborative projects.

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

_Last Updated: 2025-09-30_
_Next Review: After Phase 3 (Illustrations) completion and marketplace foundation build_

## Recent Accomplishments

### 2025-09-30 - Tags Migration & Phase 4 Completion
- ✅ Completed tags migration (replaced rigid categories with flexible tags)
- ✅ Tags system with popularity tracking for models
- ✅ Model upload form with tag input
- ✅ Browse page with tag filtering
- ✅ Database migration with GIN indexes for performance
- ✅ Phase 4.1 (Asset Integration) - COMPLETE
- ✅ Phase 4.2 (Fork & Collaboration) - COMPLETE

### 2025-09-29 - Phase 4 Infrastructure Build
- Created complete project_relationships table with RLS policies
- Created project_merge_proposals table with approval workflow
- Built complete ProjectRelationshipService with full CRUD operations
- Implemented all collaboration server actions (invite, respond, propose, merge)
- Created InviteCollaboratorDialog component
- Created ProposeProjectMergeDialog component
- Built /dashboard page with pending invites and merge proposals
- Implemented automatic revenue split calculation
- Added multi-party approval workflow for merges
- Auto-creation of merged projects with co-ownership

### Earlier Achievements
- Game project editor with TipTap rich text editing
- Model upload and management system
- Supabase Storage integration
- Asset integration into rulebooks
- License compatibility validation
- Project settings with delete/archive functionality

## Next Strategic Actions (Prioritized)

**IMMEDIATE** (This week):
1. **Phase 3 - Illustrations** (6-8 hours): Leverage model infrastructure for quick content type expansion
2. **Unified Discovery** (4-6 hours): Enhanced /browse for games + models + illustrations
3. **E2E Testing** (2-3 hours): Validate collaboration workflows with 3 test accounts
4. **Phase 5 - Marketplace** (12-16 hours): Build revenue engine with Stripe integration

**DEFERRED** (Post-MVP):
- User profiles & portfolios (Phase 6)
- Email notification enhancements (Phase 6)
- Sync blocks & design principles (Phase 6)
- Real-time collaboration with Yjs (Phase 7)
