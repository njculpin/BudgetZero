# Budget Zero - Development Roadmap

> **⚠️ IMPORTANT: This is a PLANNING DOCUMENT only.**
> 
> When working on the actual Budget Zero project implementation, refer to this roadmap for guidance but DO NOT modify this file. 
> 
> Instead, work on the actual project files in the `budget-zero/` directory.
> 
> **To implement features:**
> - Use this plan as your guide
> - Work directly in the project code
> - Update actual project files, not this planning document

## 🚀 Where to Start Building

### Phase 1: Foundation (Weeks 1-4)

#### Week 1: Development Environment Setup
```bash
# 1. Initialize Vite + TypeScript project
npm create vite@latest budget-zero -- --template vanilla-ts
cd budget-zero

# 2. Install jsx-dom for clean JSX without virtual DOM
npm install jsx-dom
npm install --save-dev @types/jsx-dom

# 3. Set up TypeScript with JSX support
# Update tsconfig.json with jsx: "react-jsx" and jsxImportSource: "jsx-dom"
```

**Key Files to Create:**
- `src/main.tsx` - Main app with JSX components
- `src/components/` - Reusable JSX components
- `src/styles/app.css` - Clean, minimal CSS
- `.env` - Environment variables

#### Week 2: Core App Structure with JSX
**Priority Order:**
1. **Landing Page** - Simple JSX component
2. **Authentication** - Invite-based login with JSX forms
3. **Dashboard** - Basic user dashboard
4. **Navigation** - Simple routing between views

```tsx
// Example: Clean JSX component structure
function LandingPage() {
  const title = <h1>Budget Zero</h1> as HTMLHeadingElement
  const subtitle = <p>Collaborative game design platform</p> as HTMLParagraphElement
  const button = <button class="btn btn-primary">Get Started</button> as HTMLButtonElement
  
  button.addEventListener('click', () => app.navigate('auth'))
  
  return (
    <div class="landing">
      {title}
      {subtitle}
      {button}
    </div>
  ) as HTMLDivElement
}
```

#### Week 3: Component System & State Management
**Build These Components:**
1. **Button Component** - Reusable button with variants
2. **Input Component** - Form inputs with validation
3. **Card Component** - Content containers
4. **Navigation Component** - Simple routing

**Tech Stack Setup:**
- JSX components with jsx-dom
- Simple state management (localStorage + objects)
- CSS for styling (no framework dependencies)

#### Week 4: Basic Features & Polish
**Implement:**
1. **User Authentication** - Simple invite code system
2. **Project Creation** - Basic project form
3. **Responsive Design** - Mobile-first CSS
4. **Basic Routing** - View switching without complex router

### Phase 2: Core Features (Weeks 5-8)

#### Week 5: Project Management
1. **Project Dashboard** - List and manage projects
2. **Milestone System** - Basic milestone creation
3. **Simple Forms** - Project and milestone forms

#### Week 6: Collaboration Foundation
1. **User Profiles** - Basic profile pages
2. **Project Sharing** - Simple project visibility
3. **Basic Comments** - Project discussion

#### Week 7: File Management
1. **Asset Upload** - Simple file upload system
2. **Image Gallery** - Project image management
3. **Basic Storage** - Local file handling

#### Week 8: Polish & Testing
1. **Error Handling** - User-friendly error messages
2. **Loading States** - Simple loading indicators
3. **Performance** - Optimize bundle size and load times

### Phase 3: Advanced Features (Weeks 9-12)

#### Week 9: Rich Text Editor
1. **ProseMirror Integration** - Basic rich text editing
2. **Game Templates** - Rulebook templates
3. **Export System** - Basic PDF generation

#### Week 10: Real-time Features
1. **WebSocket Setup** - Basic real-time updates
2. **Live Collaboration** - Simple collaborative editing
3. **Notifications** - Basic notification system

#### Week 11: Marketplace Foundation
1. **Product Listings** - Basic marketplace structure
2. **Payment Integration** - Simple Stripe setup
3. **Download System** - File delivery

#### Week 12: Launch Preparation
1. **User Onboarding** - Welcome flow
2. **Documentation** - User guides
3. **Performance** - Final optimizations

## 🛠️ Technical Implementation Order

### 1. Start Here (Week 1)
```bash
# Create ultra-minimal project (Vite + TypeScript + JSX)
npm create vite@latest budget-zero -- --template vanilla-ts
cd budget-zero
npm install jsx-dom
npm install --save-dev @types/jsx-dom

# Start with minimal dependencies - add only when absolutely needed
# Week 1: Vite + TypeScript + jsx-dom
# Week 3: npm install prosemirror-state prosemirror-view prosemirror-model
# Week 7: npm install @stripe/stripe-js (payments)
# Week 10: npm install ws (WebSocket server)
```

### 2. JSX Component Architecture

#### Component Structure
```tsx
// src/components/Button.tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  onClick?: () => void
  children: string
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  disabled = false, 
  onClick, 
  children 
}: ButtonProps) {
  const button = (
    <button 
      class={`btn btn--${variant} btn--${size}`}
      disabled={disabled}
    >
      {children}
    </button>
  ) as HTMLButtonElement
  
  if (onClick) {
    button.addEventListener('click', onClick)
  }
  
  return button
}
```

#### App Structure
```tsx
// src/main.tsx
import { LandingPage } from './components/LandingPage'
import { AuthPage } from './components/AuthPage'
import { DashboardPage } from './components/DashboardPage'

const app = {
  currentView: 'landing' as 'landing' | 'auth' | 'dashboard',
  
  render() {
    const container = document.getElementById('app')
    if (!container) return
    
    container.innerHTML = ''
    
    let viewElement: HTMLElement
    switch (this.currentView) {
      case 'landing':
        viewElement = <LandingPage />
        break
      case 'auth':
        viewElement = <AuthPage />
        break
      case 'dashboard':
        viewElement = <DashboardPage />
        break
      default:
        viewElement = <LandingPage />
    }
    
    container.appendChild(viewElement)
  }
}
```

### 3. State Management (Simple & Direct)

```tsx
// Simple app state without complex abstractions
const appState = {
  user: null as User | null,
  currentProject: null as Project | null,
  
  // Simple state updates
  setUser(user: User | null) {
    this.user = user
    localStorage.setItem('user', JSON.stringify(user))
    this.render()
  },
  
  setCurrentProject(project: Project | null) {
    this.currentProject = project
    this.render()
  },
  
  // Load state from localStorage
  loadState() {
    const user = localStorage.getItem('user')
    if (user) {
      this.user = JSON.parse(user)
    }
  }
}
```

### 4. Routing (Simple View Switching)

```tsx
// Simple routing without complex libraries
const router = {
  currentRoute: 'landing',
  
  navigate(route: string) {
    this.currentRoute = route
    window.history.pushState({ route }, '', `/${route}`)
    app.render()
  },
  
  handlePopState(event: PopStateEvent) {
    if (event.state?.route) {
      this.currentRoute = event.state.route
      app.render()
    }
  }
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
  router.handlePopState(event)
})
```

### 5. CSS Architecture (Minimal & Fast)

```css
/* src/styles/app.css */
:root {
  /* Colors */
  --color-primary: #2563eb;
  --color-secondary: #64748b;
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;
  
  /* Typography */
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  
  /* Spacing */
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
}

/* Component styles */
.btn {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: var(--font-size-base);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn--primary {
  background: var(--color-primary);
  color: white;
}

.btn--primary:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}
```

## 🎯 Success Metrics for Each Phase

### Phase 1 Success (Week 4)
- [ ] User can navigate between views smoothly
- [ ] JSX components render correctly
- [ ] Basic styling is clean and responsive
- [ ] App loads in under 1 second

### Phase 2 Success (Week 8)
- [ ] User can create and manage projects
- [ ] Basic milestone system works
- [ ] File uploads function properly
- [ ] App bundle size under 100KB

### Phase 3 Success (Week 12)
- [ ] Rich text editor is functional
- [ ] Real-time updates work
- [ ] Basic marketplace functions
- [ ] Ready for first alpha users

## 🚨 Critical Path Items

**Cannot launch without:**
1. ✅ **JSX Component System** (Week 2)
2. ✅ **Simple State Management** (Week 3)
3. ✅ **Basic Routing** (Week 4)
4. ✅ **User Authentication** (Week 5)

**Nice to have for alpha:**
1. Rich text editor (Week 9)
2. Real-time features (Week 10)
3. Basic marketplace (Week 11)

## 🔧 Development Philosophy: JSX + Minimal

### JSX-First Approach
- **Clean Component Structure** - JSX makes components readable and maintainable
- **No Virtual DOM** - Direct DOM manipulation for maximum performance
- **Type Safety** - Full TypeScript support for props and events
- **Minimal Overhead** - Just JSX compilation, no runtime framework

### Zero-Dependency Mindset
- **Add dependencies only when absolutely needed**
- **jsx-dom for JSX** - No React, Vue, or other frameworks
- **Vanilla CSS** - No CSS frameworks or preprocessors
- **Standard Web APIs** - Use browser-native features

### Local-First Development
- **Develop entirely offline** - no external services during development
- **Local file storage** - simple file handling without cloud dependencies
- **Standard protocols** - HTTP, WebSocket, SQL (vendor agnostic)
- **Production flexibility** - deploy anywhere (Vercel, Netlify, self-hosted)

### Performance First
- **Lighthouse 100 scores** on all pages
- **Sub-100ms interactions** for all user actions
- **Minimal JavaScript bundles** - under 100KB for initial load
- **Progressive enhancement** over SPA complexity

### Technical Decisions (JSX + Minimal Stack)
- **Vite + TypeScript** - Lightning-fast development with type safety
- **jsx-dom** - Clean JSX syntax without virtual DOM overhead
- **Vanilla CSS** - No framework dependencies, maximum performance
- **Simple State Management** - Objects and localStorage, no complex state libraries
- **Direct DOM Manipulation** - No abstraction layers, maximum control

This roadmap gets you from zero to alpha in 12 weeks with **clean JSX components**, **minimal dependencies**, and **maximum performance**.
