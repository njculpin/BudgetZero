# Budget Zero - Development Roadmap

## 🚀 Where to Start Building

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: Development Environment Setup
```bash
# 1. Initialize Remix project
npx create-remix@latest budget-zero --template remix-run/remix/templates/vercel
cd budget-zero

# 2. Install core dependencies
npm install @supabase/supabase-js stripe tailwindcss @headlessui/react
npm install --save-dev @types/node prisma

# 3. Set up database (PostgreSQL via Supabase initially)
npx prisma init
```

**Key Files to Create:**
- `app/utils/supabase.server.ts` - Database connection
- `app/utils/auth.server.ts` - Authentication utilities
- `.env` - Environment variables
- `prisma/schema.prisma` - Database schema

#### Week 2: Core Database Schema & Auth
**Priority Order:**
1. **Users** table with invite system
2. **Projects** table (basic structure)
3. **Milestones** table
4. **Invites** table for controlled access
5. Basic authentication flow

```sql
-- Start with these core tables
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  name VARCHAR NOT NULL,
  bio TEXT,
  avatar_url VARCHAR,
  invite_code VARCHAR,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES users(id),
  status VARCHAR DEFAULT 'Idea',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Week 3: Basic UI & Project Creation
**Build These Pages:**
1. `/login` - Simple invite-code authentication
2. `/dashboard` - User dashboard with projects list
3. `/projects/new` - Create new project form
4. `/projects/:id` - Basic project view

**Tech Stack Setup:**
- Remix routes and loaders
- Tailwind CSS styling
- Basic form handling with Remix actions

#### Week 4: Collaborative Rulebook Editor Foundation
**Implement:**
1. CodeMirror integration for markdown editing
2. Basic rulebook model (attached to projects)
3. Simple save/load functionality
4. Version history (basic)

### Phase 2: Core Features (Weeks 5-8)

#### Week 5: Milestone System
1. Milestone creation and editing
2. Funding goal tracking
3. Basic milestone lifecycle (Planning → Active → Completed)
4. Simple progress visualization

#### Week 6: Payment Integration (Stripe)
1. Stripe Connect setup for multi-party payments
2. Basic contribution flow
3. Milestone funding mechanics
4. Simple escrow system

#### Week 7: Real-time Collaboration
1. WebSocket server setup
2. Real-time rulebook editing (basic operational transformation)
3. Live cursors and user presence
4. Simple conflict resolution

#### Week 8: Webhook System (MVP)
1. Basic webhook endpoint registration
2. Core event types (project.created, milestone.completed)
3. Secure signature verification
4. Simple retry mechanism

### Phase 3: Professional Features (Weeks 9-12)

#### Week 9: PDF Export System
1. PDF generation from markdown
2. Professional formatting
3. Custom branding options
4. Print-ready output

#### Week 10: Asset Management
1. File upload system
2. Basic version control
3. Asset linking to rulebook sections
4. Download/sharing controls

#### Week 11: Playtesting Infrastructure (Basic)
1. Simple playtesting session scheduling
2. Basic feedback collection forms
3. Session notes and comments
4. Feedback aggregation

#### Week 12: Polish & Launch Prep
1. Invite system refinement
2. Onboarding flow
3. Error handling and validation
4. Performance optimization

## 🛠️ Technical Implementation Order

### 1. Start Here (Week 1)
```bash
# Create the project
npx create-remix@latest budget-zero --template remix-run/remix/templates/vercel
cd budget-zero

# Essential dependencies
npm install @supabase/supabase-js @stripe/stripe-js
npm install @codemirror/view @codemirror/state @codemirror/lang-markdown
npm install @headlessui/react @heroicons/react tailwindcss
npm install --save-dev prisma @types/node
```

### 2. Environment Setup
```env
# .env
DATABASE_URL="postgresql://..."
SUPABASE_URL="https://..."
SUPABASE_ANON_KEY="..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
JWT_SECRET="your-secret-here"
```

### 3. Database Schema (Week 2)
**Start with minimal schema:**
- Users (with invite system)
- Projects (basic info)
- Rulebooks (content + project_id)
- Milestones (goals + project_id)
- Invites (codes + usage tracking)

### 4. First Routes to Build
1. `app/routes/_index.tsx` - Landing page
2. `app/routes/auth.tsx` - Invite-based authentication
3. `app/routes/dashboard.tsx` - User dashboard
4. `app/routes/projects.$projectId.tsx` - Project view
5. `app/routes/projects.$projectId.rulebook.tsx` - Rulebook editor

## 🎯 Success Metrics for Each Phase

### Phase 1 Success (Week 4)
- [ ] User can register with invite code
- [ ] User can create a project
- [ ] User can edit a basic rulebook
- [ ] Data persists correctly

### Phase 2 Success (Week 8)
- [ ] Milestone funding works end-to-end
- [ ] Real-time editing functional
- [ ] Webhooks deliver project data
- [ ] Multiple users can collaborate

### Phase 3 Success (Week 12)
- [ ] Professional PDF export
- [ ] Basic playtesting workflow
- [ ] Asset management functional
- [ ] Ready for first alpha users

## 🚨 Critical Path Items

**Cannot launch without:**
1. Invite-only authentication ✅ (Week 2)
2. Collaborative rulebook editor ✅ (Week 4)
3. Milestone funding system ✅ (Week 6)
4. Webhook data portability ✅ (Week 8)

**Nice to have for alpha:**
1. PDF export (Week 9)
2. Asset management (Week 10)
3. Playtesting tools (Week 11)

## 🔧 Development Tips

### Start Small, Build Fast
- Use Supabase for rapid prototyping
- Deploy early to Vercel (week 2)
- Get feedback from first users quickly
- Iterate based on real usage

### Focus on Core Value
- Rulebook collaboration is the unique differentiator
- Webhook system prevents lock-in concerns
- Keep everything else minimal until proven

### Technical Decisions
- **Remix** for full-stack simplicity
- **Supabase** for rapid development (migrate later)
- **Tailwind** for consistent UI
- **CodeMirror** for professional editing
- **Stripe** for reliable payments

This roadmap gets you from zero to alpha in 12 weeks with a laser focus on core value and rapid iteration.
