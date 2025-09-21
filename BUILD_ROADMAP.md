# Budget Zero - Development Roadmap

> **⚠️ IMPORTANT: This is a PLANNING DOCUMENT only.**
>
> When working on the actual Budget Zero project implementation, refer to this roadmap for guidance but DO NOT modify this file.
>
> Instead, work on the actual project files in the root directory.
>
> **To implement features:**
> - Use this plan as your guide
> - Work directly in the project code
> - Update actual project files, not this planning document

## 🚀 Where to Start Building

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: Development Environment Setup
```bash
# 1. Initialize Vite + React SWC + TypeScript project
npm create vite@latest budget-zero -- --template react-swc-ts
cd budget-zero

# 2. Install core dependencies
npm install @tanstack/react-router @tanstack/react-query
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
npm install @stripe/stripe-js @stripe/react-stripe-js

# 3. Install dev dependencies
npm install --save-dev @tanstack/router-devtools
```

**Key Files to Create:**
- `src/main.tsx` - App entry point with React Router
- `src/components/` - Reusable React components with BEM CSS
- `src/styles/` - BEM-organized stylesheets
- `src/lib/supabase.ts` - Supabase configuration
- `.env` - Environment variables

#### Week 2: Core App Structure with React + BEM
**Priority Order:**
1. **Landing Page** - React component with BEM CSS
2. **Authentication** - Supabase Auth UI integration
3. **Dashboard** - Protected user dashboard
4. **Navigation** - Tanstack Router setup

```tsx
// Example: Clean React component with BEM
function LandingPage() {
  return (
    <div className="landing">
      <header className="landing__header">
        <h1 className="landing__title">Budget Zero</h1>
        <p className="landing__subtitle">Collaborative budget management platform</p>
      </header>
      <section className="landing__actions">
        <button className="btn btn--primary btn--large">
          Get Started
        </button>
      </section>
    </div>
  )
}
```

#### Week 3: Component System & State Management
**Build These Components:**
1. **Button Component** - Reusable with BEM variants
2. **Input Component** - Form inputs with validation
3. **Card Component** - Content containers
4. **Layout Components** - Navigation, headers, sidebars

**Tech Stack Setup:**
- React components with TypeScript
- Tanstack Query for state management
- BEM methodology for CSS organization
- Supabase Auth for authentication

#### Week 4: Basic Features & Polish
**Implement:**
1. **Supabase Authentication** - Email/password + social auth
2. **Protected Routes** - Route guards with Tanstack Router
3. **Responsive Design** - Mobile-first BEM CSS
4. **Error Boundaries** - React error handling

### Phase 2: Core Features (Weeks 5-8)

#### Week 5: Game Project Management
1. **Project Dashboard** - Supabase DB integration for game projects
2. **Project Creation** - Game project forms with categories (board-game, card-game, RPG, etc.)
3. **Project CRUD** - Create, read, update, delete game projects

#### Week 6: Milestone System
1. **Milestone Creation** - Funding goals, deliverables, timeline
2. **Milestone Tracking** - Progress visualization and status updates
3. **Funding Management** - Track milestone funding and goals

#### Week 7: Collaboration Features
1. **Contributor Profiles** - Illustrators, 3D modelers, writers, designers
2. **Application System** - Apply to work on milestones with portfolio
3. **Compensation Management** - Equity, fixed, royalty, credit tracking

#### Week 8: Asset Management
1. **Supabase Storage** - Upload game assets (images, 3D models, documents)
2. **Asset Gallery** - Organized asset management interface
3. **Version Control** - Asset versioning and approval workflow

### Phase 3: Advanced Features (Weeks 9-12)

#### Week 9: Collaborative Rulebook Editor
1. **Rich Text Editor** - Notion-like editor with TipTap/ProseMirror
2. **Real-time Collaboration** - Live editing with multiple contributors
3. **Version Control** - Track changes and revert to previous versions

#### Week 10: Rulebook Layout & Export
1. **PDF Layout System** - Professional game rulebook templates
2. **PDF Export Engine** - High-quality PDF generation with custom styling
3. **Print-ready Files** - Multiple formats (A4, Letter, booklet layouts)

#### Week 11: Community Features
1. **Discussion System** - Project and milestone comment threads
2. **Recommendation Engine** - Community suggestions for collaborators/services
3. **Portfolio Showcase** - Professional profiles for contributors

#### Week 12: Launch Preparation
1. **Performance Optimization** - Bundle splitting and caching
2. **Security Audit** - Row Level Security (RLS) configuration
3. **Creator Onboarding** - Guided project creation flow

## 🛠️ Technical Implementation Order

### 1. Start Here (Week 1)
```bash
# Initialize Vite React SWC TypeScript project in root
npm create vite@latest . -- --template react-swc-ts

# Install core dependencies
npm install @tanstack/react-router @tanstack/react-query
npm install @supabase/supabase-js @supabase/auth-ui-react @supabase/auth-ui-shared
npm install @stripe/stripe-js @stripe/react-stripe-js

# Install dev dependencies
npm install --save-dev @tanstack/router-devtools @tanstack/router-vite-plugin
```

### 2. React Component Architecture with BEM

#### Component Structure
```tsx
// src/components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'small' | 'medium' | 'large'
  disabled?: boolean
  onClick?: () => void
  children: React.ReactNode
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  onClick,
  children,
  className = ''
}: ButtonProps) {
  const baseClass = 'btn'
  const modifierClasses = `${baseClass}--${variant} ${baseClass}--${size}`
  const fullClassName = `${baseClass} ${modifierClasses} ${className}`.trim()

  return (
    <button
      className={fullClassName}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  )
}
```

#### App Structure with Router
```tsx
// src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { routeTree } from './routeTree.gen'
import './styles/main.css'

const queryClient = new QueryClient()
const router = createRouter({ routeTree })

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </React.StrictMode>
)
```

### 3. State Management with Tanstack Query

```tsx
// src/hooks/useBudgets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useBudgets() {
  return useQuery({
    queryKey: ['budgets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budgets')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    }
  })
}

export function useCreateBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (budget: Omit<Budget, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('budgets')
        .insert(budget)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['budgets'] })
    }
  })
}
```

### 4. Routing with Tanstack Router

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <div className="app">
        <Outlet />
      </div>
      <TanStackRouterDevtools />
    </>
  )
})

// src/routes/index.tsx
import { createFileRoute } from '@tanstack/react-router'
import { LandingPage } from '../components/LandingPage'

export const Route = createFileRoute('/')({
  component: LandingPage
})

// src/routes/dashboard.tsx
import { createFileRoute, redirect } from '@tanstack/react-router'
import { Dashboard } from '../components/Dashboard'
import { supabase } from '../lib/supabase'

export const Route = createFileRoute('/dashboard')({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      throw redirect({ to: '/auth' })
    }
  },
  component: Dashboard
})
```

### 5. BEM CSS Architecture

```css
/* src/styles/main.css */
:root {
  /* Design tokens */
  --color-primary: #3b82f6;
  --color-primary-dark: #1d4ed8;
  --color-secondary: #64748b;
  --color-success: #10b981;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --border-radius: 0.5rem;
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
}

/* Button component */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.btn--primary {
  background-color: var(--color-primary);
  color: white;
}

.btn--primary:hover:not(:disabled) {
  background-color: var(--color-primary-dark);
  transform: translateY(-1px);
}

.btn--small {
  padding: var(--spacing-xs) var(--spacing-sm);
  font-size: 0.875rem;
}

.btn--medium {
  padding: var(--spacing-sm) var(--spacing-md);
  font-size: 1rem;
}

.btn--large {
  padding: var(--spacing-md) var(--spacing-lg);
  font-size: 1.125rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

/* Layout components */
.landing {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.landing__header {
  text-align: center;
  padding: var(--spacing-xl) var(--spacing-md);
}

.landing__title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: var(--spacing-md);
  color: var(--color-primary);
}

.landing__subtitle {
  font-size: 1.25rem;
  color: var(--color-secondary);
  margin-bottom: var(--spacing-lg);
}

.landing__actions {
  display: flex;
  gap: var(--spacing-md);
  justify-content: center;
}
```

### 6. Supabase Integration for Game Platform

```tsx
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface GameProject {
  id: string
  name: string
  description: string
  category: 'board-game' | 'card-game' | 'rpg' | 'miniature-game' | 'other'
  status: 'idea' | 'in-development' | 'completed' | 'published'
  creator_id: string
  target_audience: string
  estimated_players: string
  estimated_playtime: string
  concept_art_url?: string
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string
  funding_goal: number
  current_funding: number
  deliverables: string[]
  timeline_weeks: number
  required_skills: string[]
  status: 'planning' | 'funding' | 'in-progress' | 'completed'
  created_at: string
  deadline?: string
}

export interface Contributor {
  id: string
  user_id: string
  project_id: string
  role: 'illustrator' | '3d-modeler' | 'writer' | 'graphic-designer' | 'game-designer'
  compensation_type: 'equity' | 'fixed' | 'royalty' | 'credit' | 'hybrid'
  status: 'applied' | 'accepted' | 'active' | 'completed'
  created_at: string
}
```

```sql
-- Supabase SQL schema for game platform
create table game_projects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text not null,
  category text check (category in ('board-game', 'card-game', 'rpg', 'miniature-game', 'other')) not null,
  status text check (status in ('idea', 'in-development', 'completed', 'published')) default 'idea',
  creator_id uuid references auth.users(id) on delete cascade,
  target_audience text,
  estimated_players text,
  estimated_playtime text,
  concept_art_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table milestones (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references game_projects(id) on delete cascade,
  name text not null,
  description text not null,
  funding_goal decimal(10,2) not null default 0,
  current_funding decimal(10,2) not null default 0,
  deliverables text[] not null default '{}',
  timeline_weeks integer not null,
  required_skills text[] not null default '{}',
  status text check (status in ('planning', 'funding', 'in-progress', 'completed')) default 'planning',
  deadline timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table contributors (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references game_projects(id) on delete cascade,
  milestone_id uuid references milestones(id) on delete set null,
  role text check (role in ('illustrator', '3d-modeler', 'writer', 'graphic-designer', 'game-designer', 'playtester')) not null,
  compensation_type text check (compensation_type in ('equity', 'fixed', 'royalty', 'credit', 'hybrid')) not null,
  compensation_details text,
  status text check (status in ('applied', 'accepted', 'active', 'completed')) default 'applied',
  application_message text,
  portfolio_links text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Row Level Security
alter table game_projects enable row level security;
alter table milestones enable row level security;
alter table contributors enable row level security;

-- Game Projects policies
create policy "Anyone can view published projects" on game_projects for select using (status = 'published' or status = 'completed');
create policy "Users can view own projects" on game_projects for select using (auth.uid() = creator_id);
create policy "Users can create projects" on game_projects for insert with check (auth.uid() = creator_id);
create policy "Users can update own projects" on game_projects for update using (auth.uid() = creator_id);

-- Milestones policies
create policy "Users can view project milestones" on milestones for select using (
  exists (select 1 from game_projects where id = project_id and (creator_id = auth.uid() or status in ('completed', 'published')))
);
create policy "Project creators can manage milestones" on milestones for all using (
  exists (select 1 from game_projects where id = project_id and creator_id = auth.uid())
);

-- Contributors policies
create policy "Users can view project contributors" on contributors for select using (
  exists (select 1 from game_projects where id = project_id and (creator_id = auth.uid() or status in ('completed', 'published')))
  or user_id = auth.uid()
);
create policy "Users can apply as contributors" on contributors for insert with check (auth.uid() = user_id);
create policy "Project creators can manage contributors" on contributors for update using (
  exists (select 1 from game_projects where id = project_id and creator_id = auth.uid())
);
```

## 🎯 Success Metrics for Each Phase

### Phase 1 Success (Week 4)
- [ ] User can navigate between routes with Tanstack Router
- [ ] React components render with proper BEM CSS
- [ ] Supabase authentication works
- [ ] App loads in under 2 seconds

### Phase 2 Success (Week 8)
- [ ] Users can create and manage budgets
- [ ] Real-time updates work with Supabase Realtime
- [ ] File uploads work with Supabase Storage
- [ ] Stripe payments are functional

### Phase 3 Success (Week 12)
- [ ] Advanced analytics dashboard
- [ ] PWA functionality works offline
- [ ] Performance optimizations complete
- [ ] Ready for production launch

## 🚨 Critical Path Items

**Cannot launch without:**
1. ✅ **React + Vite + TypeScript** (Week 1)
2. ✅ **Tanstack Router + Query** (Week 2)
3. ✅ **Supabase Auth + DB** (Week 3)
4. ✅ **BEM CSS System** (Week 4)

**Essential for MVP:**
1. Budget CRUD operations (Week 5)
2. Real-time collaboration (Week 6)
3. Stripe integration (Week 8)

## 🔧 Development Philosophy: Modern React + Best Practices

### React-First Approach
- **Component Composition** - Small, reusable components with clear interfaces
- **TypeScript Safety** - Full type coverage for props, state, and API responses
- **Performance Optimization** - React.memo, useMemo, useCallback where needed
- **Accessibility** - ARIA labels, semantic HTML, keyboard navigation

### Modern Tooling
- **Vite + SWC** - Lightning-fast development and builds
- **Tanstack Router** - Type-safe routing with code splitting
- **Tanstack Query** - Server state management with caching
- **Supabase** - Backend-as-a-Service with real-time capabilities

### Architecture Principles
- **Speed First** - Optimize for fast development and runtime performance
- **Strong Types** - TypeScript everywhere for better DX and fewer bugs
- **Best Practices** - Follow React and web standards
- **Scalable Structure** - Organized codebase that grows with the project

### 7. Collaborative Rulebook Editor Architecture

```bash
# Install editor dependencies
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-collaboration
npm install @tiptap/extension-collaboration-cursor @tiptap/extension-image
npm install @tiptap/extension-table @tiptap/extension-link
npm install yjs y-supabase y-webrtc
npm install jspdf html2canvas puppeteer
```

#### Editor Component Structure
```tsx
// src/components/RulebookEditor.tsx
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import CollaborationCursor from '@tiptap/extension-collaboration-cursor'
import Table from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import * as Y from 'yjs'
import { SupabaseProvider } from 'y-supabase'

export function RulebookEditor({ projectId, userId }) {
  const ydoc = new Y.Doc()

  const provider = new SupabaseProvider(ydoc, projectId, {
    supabaseUrl: process.env.VITE_SUPABASE_URL,
    supabaseKey: process.env.VITE_SUPABASE_ANON_KEY,
  })

  const editor = useEditor({
    extensions: [
      StarterKit,
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user: {
          name: userId,
          color: '#f783ac',
        },
      }),
      Table.configure({
        resizable: true,
      }),
      Image.configure({
        HTMLAttributes: {
          class: 'rulebook-image',
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
  })

  return (
    <div className="rulebook-editor">
      <div className="rulebook-editor__toolbar">
        <EditorToolbar editor={editor} />
      </div>
      <div className="rulebook-editor__content">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
```

#### PDF Export System
```tsx
// src/lib/pdfExport.ts
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export interface RulebookTemplate {
  name: string
  pageSize: 'A4' | 'Letter' | 'A5'
  layout: 'single' | 'booklet' | 'spread'
  margins: { top: number; right: number; bottom: number; left: number }
  fonts: { heading: string; body: string; caption: string }
  colors: { primary: string; secondary: string; accent: string }
}

export const DEFAULT_TEMPLATES: RulebookTemplate[] = [
  {
    name: 'Modern Board Game',
    pageSize: 'A4',
    layout: 'booklet',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    fonts: { heading: 'Arial Black', body: 'Arial', caption: 'Arial' },
    colors: { primary: '#2563eb', secondary: '#64748b', accent: '#059669' }
  },
  {
    name: 'Classic RPG',
    pageSize: 'Letter',
    layout: 'single',
    margins: { top: 25, right: 25, bottom: 25, left: 25 },
    fonts: { heading: 'Times New Roman', body: 'Times New Roman', caption: 'Times New Roman' },
    colors: { primary: '#8b5a2b', secondary: '#5d4e37', accent: '#cd853f' }
  }
]

export async function exportRulebookToPDF(
  htmlContent: string,
  template: RulebookTemplate,
  projectName: string
): Promise<Blob> {
  // Create a temporary container with the styled content
  const tempContainer = document.createElement('div')
  tempContainer.innerHTML = htmlContent
  tempContainer.style.width = template.pageSize === 'A4' ? '210mm' : '8.5in'
  tempContainer.style.fontFamily = template.fonts.body
  tempContainer.style.color = template.colors.primary
  tempContainer.style.padding = `${template.margins.top}mm ${template.margins.right}mm ${template.margins.bottom}mm ${template.margins.left}mm`

  // Apply template styles
  applyTemplateStyles(tempContainer, template)

  // Temporarily add to DOM for rendering
  tempContainer.style.position = 'absolute'
  tempContainer.style.left = '-9999px'
  document.body.appendChild(tempContainer)

  try {
    // Convert to canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
    })

    // Create PDF
    const pdf = new jsPDF({
      orientation: template.layout === 'spread' ? 'landscape' : 'portrait',
      unit: 'mm',
      format: template.pageSize.toLowerCase() as any,
    })

    const imgData = canvas.toDataURL('image/png')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()

    pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)

    return pdf.output('blob')
  } finally {
    document.body.removeChild(tempContainer)
  }
}

function applyTemplateStyles(container: HTMLElement, template: RulebookTemplate) {
  // Apply heading styles
  container.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
    ;(el as HTMLElement).style.fontFamily = template.fonts.heading
    ;(el as HTMLElement).style.color = template.colors.primary
  })

  // Apply table styles
  container.querySelectorAll('table').forEach(el => {
    ;(el as HTMLElement).style.borderCollapse = 'collapse'
    ;(el as HTMLElement).style.width = '100%'
  })

  // Apply image styles
  container.querySelectorAll('img').forEach(el => {
    ;(el as HTMLElement).style.maxWidth = '100%'
    ;(el as HTMLElement).style.height = 'auto'
  })
}
```

#### Database Schema Updates
```sql
-- Add rulebook support to game projects
alter table game_projects add column rulebook_content text;
alter table game_projects add column rulebook_template jsonb;
alter table game_projects add column rulebook_version integer default 1;

-- Create rulebook versions table for history
create table rulebook_versions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references game_projects(id) on delete cascade,
  version integer not null,
  content text not null,
  template jsonb,
  created_by uuid references auth.users(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create collaborative editing sessions
create table editing_sessions (
  id uuid default gen_random_uuid() primary key,
  project_id uuid references game_projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  cursor_position jsonb,
  last_seen timestamp with time zone default timezone('utc'::text, now()) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table rulebook_versions enable row level security;
alter table editing_sessions enable row level security;

-- Policies for rulebook versions
create policy "Users can view project rulebook versions" on rulebook_versions for select using (
  exists (select 1 from game_projects where id = project_id and (creator_id = auth.uid() or status in ('completed', 'published')))
);

create policy "Project contributors can create versions" on rulebook_versions for insert with check (
  exists (
    select 1 from game_projects gp
    left join contributors c on c.project_id = gp.id
    where gp.id = project_id
    and (gp.creator_id = auth.uid() or (c.user_id = auth.uid() and c.status in ('accepted', 'active')))
  )
);

-- Policies for editing sessions
create policy "Project contributors can manage editing sessions" on editing_sessions for all using (
  exists (
    select 1 from game_projects gp
    left join contributors c on c.project_id = gp.id
    where gp.id = project_id
    and (gp.creator_id = auth.uid() or (c.user_id = auth.uid() and c.status in ('accepted', 'active')))
  )
);
```

### Technical Stack Summary
- **Frontend**: Vite + React + SWC + TypeScript
- **Routing**: Tanstack Router (file-based, type-safe)
- **State**: Tanstack Query (server state) + React state (UI state)
- **Backend**: Supabase (Auth, DB, Storage, Functions, Realtime)
- **Styling**: BEM CSS methodology
- **Payments**: Stripe
- **Editor**: TipTap/ProseMirror with real-time collaboration (Yjs)
- **PDF Export**: jsPDF + html2canvas for client-side generation

This roadmap delivers a modern, collaborative game design platform with professional rulebook editing and export capabilities in 12 weeks.
