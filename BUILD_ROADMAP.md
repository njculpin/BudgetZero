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
  invited_by_user_id UUID REFERENCES users(id), -- Track who invited this user
  invited_by_code VARCHAR, -- The specific invite code used
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

-- Invite System with Usage Tracking & Rewards
CREATE TABLE invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL, -- Short, memorable invite codes
  inviter_id UUID REFERENCES users(id) NOT NULL,
  invite_type VARCHAR DEFAULT 'general', -- 'creator', 'contributor', 'general', 'vip'
  max_uses INTEGER DEFAULT 1, -- How many times this code can be used
  current_uses INTEGER DEFAULT 0, -- How many times it's been used
  expires_at TIMESTAMP, -- Optional expiration
  status VARCHAR DEFAULT 'active', -- 'active', 'exhausted', 'expired', 'revoked'
  metadata JSONB, -- Extra data like special permissions, rewards, etc.
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

-- Track each invite usage for analytics and rewards
CREATE TABLE invite_usages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id UUID REFERENCES invites(id) NOT NULL,
  inviter_id UUID REFERENCES users(id) NOT NULL, -- Denormalized for faster queries
  invitee_id UUID REFERENCES users(id) NOT NULL, -- Who used the invite
  invitee_email VARCHAR NOT NULL, -- Email at time of signup
  used_at TIMESTAMP DEFAULT NOW(),
  ip_address INET, -- For fraud detection
  user_agent TEXT -- For analytics
);

-- Invite rewards system
CREATE TABLE invite_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) NOT NULL,
  invite_usage_id UUID REFERENCES invite_usages(id),
  reward_type VARCHAR NOT NULL, -- 'invite_credits', 'platform_credits', 'badge', 'feature_access'
  reward_value INTEGER, -- Amount of credits, days of access, etc.
  reward_data JSONB, -- Additional reward metadata
  status VARCHAR DEFAULT 'pending', -- 'pending', 'granted', 'revoked'
  granted_at TIMESTAMP,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- User invite statistics (for gamification)
CREATE TABLE user_invite_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_invites_sent INTEGER DEFAULT 0,
  total_invites_used INTEGER DEFAULT 0,
  successful_signups INTEGER DEFAULT 0, -- Users who actually completed onboarding
  active_invitees INTEGER DEFAULT 0, -- Invitees who are still active (30+ days)
  invite_credits_earned INTEGER DEFAULT 0, -- Total credits earned from invites
  invite_level INTEGER DEFAULT 1, -- Gamification level based on successful invites
  last_invite_sent_at TIMESTAMP,
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Invite System Features:**
- **Usage Tracking**: Every invite use is logged with analytics data
- **Reward System**: Inviters earn credits/perks for successful referrals
- **Flexible Types**: Different invite types (creator, contributor, VIP) with different permissions
- **Anti-Fraud**: IP and user agent tracking to prevent abuse
- **Gamification**: Invite levels and statistics to encourage organic growth
- **Analytics**: Detailed metrics on invite performance and user acquisition

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

#### Week 4: Design System Foundation + WebGPU Animation
**Implement:**
1. CSS Custom Properties system (colors, typography, spacing, shadows)
2. Component library using Web Components (buttons, forms, cards, modals)
3. WebGPU animation engine for high-performance UI effects
4. Particle systems for milestone celebrations and interactions
5. Responsive grid system and layout utilities
6. Icon system and brand assets with GPU-accelerated transitions
7. Documentation site for design system

#### Week 5: Custom Rich Text Editor Foundation
**Implement:**
1. ProseMirror-based editor with vanilla TypeScript (no React)
2. Game-specific schema and node types (components, mechanics, examples)
3. Yjs integration for real-time collaborative editing
4. Custom UI components using design system
5. Basic version control with change tracking

### Phase 2: Core Features (Weeks 6-9)

#### Week 6: Milestone System
1. Milestone creation and editing using design system components
2. Funding goal tracking with consistent UI patterns
3. Basic milestone lifecycle (Planning → Active → Completed)
4. Progress visualization using design system charts

#### Week 7: Payment Integration (Stripe)
1. Stripe Connect setup for multi-party payments
2. Payment UI using design system form components
3. Milestone funding mechanics
4. Simple escrow system with consistent styling

#### Week 8: Advanced Editor Features
1. Component linking system (rules ↔ game pieces)
2. Rule dependency mapping and visualization
3. Playtesting note integration
4. Smart export system (PDF, print-ready, web)

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
# Create ultra-minimal project (Vite + TypeScript, no framework)
npm create vite@latest budget-zero -- --template vanilla-ts
cd budget-zero
npm install

# Start with ZERO dependencies - add only when absolutely needed
# Week 1: Pure TypeScript + Vite + local PostgreSQL
# Week 2: npm install pg @types/pg (direct PostgreSQL connection)
# Week 3: npm install prosemirror-state prosemirror-view prosemirror-model
# Week 4: npm install @webgpu/types (for WebGPU animation system)
# Week 5: npm install yjs y-websocket y-prosemirror (collaboration)
# Week 7: npm install @stripe/stripe-js (payments)
# Later: npm install @supabase/supabase-js (only when deploying to production)
```

### 2. Local-First Development Setup
```env
# .env (local development only)
DATABASE_URL="postgresql://localhost:5432/budgetzero_dev"
JWT_SECRET="local-dev-secret-change-in-production"
NODE_ENV="development"

# Production environment variables (add when deploying):
# SUPABASE_URL, SUPABASE_ANON_KEY (or self-hosted PostgreSQL)
# STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY
# JWT_SECRET (generate secure key for production)
```

### 3. Local Database Setup
```bash
# Install PostgreSQL locally (macOS)
brew install postgresql
brew services start postgresql

# Create local database
psql postgres
CREATE DATABASE budgetzero_dev;
\q

# Alternative: Use Docker for isolated development
docker run --name budgetzero-db -e POSTGRES_DB=budgetzero_dev -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:15
```

### 3. Database Schema (Week 2)
**Start with minimal schema:**
- Users (with invite system)
- Projects (basic info)
- Rulebooks (content + project_id)
- Milestones (goals + project_id)
- Invites (codes + usage tracking)

### 4. Design System Architecture (Week 4)

#### Design Tokens (CSS Custom Properties)
```css
/* colors.css */
:root {
  /* Brand Colors */
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-secondary: #64748b;
  
  /* Semantic Colors */
  --color-success: #059669;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: #0284c7;
  
  /* Neutral Scale */
  --color-gray-50: #f8fafc;
  --color-gray-100: #f1f5f9;
  --color-gray-900: #0f172a;
  
  /* Typography */
  --font-family-sans: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'JetBrains Mono', monospace;
  
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;
  
  /* Spacing Scale */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  
  /* Border Radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

#### Component Architecture
```typescript
// Base Web Component class
abstract class DesignSystemComponent extends HTMLElement {
  protected shadow: ShadowRoot;
  protected styles: string;
  
  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this.render();
  }
  
  protected abstract render(): void;
  protected abstract getStyles(): string;
}

// Example: Button Component
class BZButton extends DesignSystemComponent {
  static get observedAttributes() {
    return ['variant', 'size', 'disabled'];
  }
  
  protected getStyles(): string {
    return `
      button {
        font-family: var(--font-family-sans);
        border-radius: var(--radius-md);
        transition: all 0.2s ease;
        cursor: pointer;
        border: none;
      }
      
      .primary {
        background: var(--color-primary);
        color: white;
      }
      
      .primary:hover {
        background: var(--color-primary-hover);
      }
      
      .secondary {
        background: var(--color-gray-100);
        color: var(--color-gray-900);
      }
      
      .small {
        padding: var(--space-2) var(--space-3);
        font-size: var(--font-size-sm);
      }
      
      .medium {
        padding: var(--space-3) var(--space-4);
        font-size: var(--font-size-base);
      }
    `;
  }
  
  protected render(): void {
    const variant = this.getAttribute('variant') || 'primary';
    const size = this.getAttribute('size') || 'medium';
    
    this.shadow.innerHTML = `
      <style>${this.getStyles()}</style>
      <button class="${variant} ${size}">
        <slot></slot>
      </button>
    `;
  }
}

customElements.define('bz-button', BZButton);
```

#### Game-Specific Components
```typescript
// Game Component Card
class BZGameComponent extends DesignSystemComponent {
  protected render(): void {
    this.shadow.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="component-card">
        <div class="component-icon">
          <slot name="icon"></slot>
        </div>
        <div class="component-info">
          <h3 class="component-name">
            <slot name="name"></slot>
          </h3>
          <p class="component-description">
            <slot name="description"></slot>
          </p>
          <div class="component-quantity">
            Quantity: <slot name="quantity"></slot>
          </div>
        </div>
      </div>
    `;
  }
}

// Milestone Progress
class BZMilestoneProgress extends DesignSystemComponent {
  protected render(): void {
    const current = parseInt(this.getAttribute('current') || '0');
    const target = parseInt(this.getAttribute('target') || '100');
    const percentage = Math.min((current / target) * 100, 100);
    
    this.shadow.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="milestone-progress">
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${percentage}%"></div>
        </div>
        <div class="progress-text">
          $${current.toLocaleString()} / $${target.toLocaleString()}
        </div>
      </div>
    `;
  }
}

customElements.define('bz-game-component', BZGameComponent);
customElements.define('bz-milestone-progress', BZMilestoneProgress);
```

#### Design System Documentation
```html
<!-- docs/design-system.html -->
<!DOCTYPE html>
<html>
<head>
  <title>Budget Zero Design System</title>
  <link rel="stylesheet" href="../src/styles/design-system.css">
</head>
<body>
  <h1>Budget Zero Design System</h1>
  
  <section>
    <h2>Colors</h2>
    <div class="color-palette">
      <!-- Color swatches with CSS variables -->
    </div>
  </section>
  
  <section>
    <h2>Typography</h2>
    <div class="typography-scale">
      <!-- Font size examples -->
    </div>
  </section>
  
  <section>
    <h2>Components</h2>
    <div class="component-examples">
      <bz-button variant="primary" size="medium">Primary Button</bz-button>
      <bz-button variant="secondary" size="small">Secondary Button</bz-button>
    </div>
  </section>
</body>
</html>
```

#### WebGPU Animation System
```typescript
// WebGPU Animation Engine
class BZAnimationEngine {
  private device: GPUDevice;
  private canvas: HTMLCanvasElement;
  private context: GPUCanvasContext;
  private pipeline: GPURenderPipeline;
  private animationFrame: number = 0;
  
  async init(canvas: HTMLCanvasElement): Promise<void> {
    // Initialize WebGPU
    const adapter = await navigator.gpu?.requestAdapter();
    if (!adapter) throw new Error('WebGPU not supported');
    
    this.device = await adapter.requestDevice();
    this.canvas = canvas;
    this.context = canvas.getContext('webgpu')!;
    
    // Configure canvas
    this.context.configure({
      device: this.device,
      format: 'bgra8unorm',
      alphaMode: 'premultiplied',
    });
    
    await this.createPipeline();
  }
  
  private async createPipeline(): Promise<void> {
    // Vertex shader for UI animations
    const vertexShaderCode = `
      struct VertexInput {
        @location(0) position: vec2<f32>,
        @location(1) uv: vec2<f32>,
        @location(2) color: vec4<f32>,
      }
      
      struct VertexOutput {
        @builtin(position) position: vec4<f32>,
        @location(0) uv: vec2<f32>,
        @location(1) color: vec4<f32>,
      }
      
      struct Uniforms {
        time: f32,
        resolution: vec2<f32>,
        mouse: vec2<f32>,
      }
      
      @group(0) @binding(0) var<uniform> uniforms: Uniforms;
      
      @vertex
      fn vs_main(input: VertexInput) -> VertexOutput {
        var output: VertexOutput;
        
        // Apply time-based transformations for animations
        var pos = input.position;
        pos.x += sin(uniforms.time * 2.0 + pos.y * 10.0) * 0.01;
        
        output.position = vec4<f32>(pos, 0.0, 1.0);
        output.uv = input.uv;
        output.color = input.color;
        
        return output;
      }
    `;
    
    // Fragment shader for effects
    const fragmentShaderCode = `
      @fragment
      fn fs_main(
        @location(0) uv: vec2<f32>,
        @location(1) color: vec4<f32>
      ) -> @location(0) vec4<f32> {
        // Add glow effects, gradients, etc.
        var glow = smoothstep(0.0, 1.0, 1.0 - length(uv - 0.5));
        return color * glow;
      }
    `;
    
    // Create shaders and pipeline...
    // (Implementation details)
  }
  
  // Animation methods
  animateButton(element: HTMLElement, type: 'hover' | 'click' | 'focus'): void {
    // GPU-accelerated button animations
  }
  
  animateMilestoneProgress(current: number, target: number): void {
    // Smooth progress bar animations with particles
  }
  
  animateProjectCard(element: HTMLElement, state: 'enter' | 'exit'): void {
    // Card flip/slide animations
  }
  
  createParticleSystem(config: ParticleConfig): ParticleSystem {
    // Milestone celebration particles, hover effects
    return new ParticleSystem(this.device, config);
  }
}

// Particle system for celebrations and effects
class ParticleSystem {
  private particles: Particle[] = [];
  private buffer: GPUBuffer;
  
  constructor(private device: GPUDevice, private config: ParticleConfig) {
    this.initializeParticles();
  }
  
  private initializeParticles(): void {
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push({
        position: [Math.random() * 2 - 1, Math.random() * 2 - 1],
        velocity: [Math.random() * 0.02 - 0.01, Math.random() * 0.02 - 0.01],
        life: Math.random(),
        size: Math.random() * 0.01 + 0.005,
        color: this.config.color
      });
    }
  }
  
  update(deltaTime: number): void {
    // Update particle physics on GPU
  }
  
  render(renderPass: GPURenderPassEncoder): void {
    // Render particles with GPU
  }
}

// Enhanced Web Components with WebGPU
class BZAnimatedButton extends DesignSystemComponent {
  private animationEngine: BZAnimationEngine;
  private canvas: HTMLCanvasElement;
  
  constructor() {
    super();
    this.setupWebGPU();
  }
  
  private async setupWebGPU(): Promise<void> {
    this.canvas = document.createElement('canvas');
    this.canvas.style.position = 'absolute';
    this.canvas.style.top = '0';
    this.canvas.style.left = '0';
    this.canvas.style.pointerEvents = 'none';
    
    this.animationEngine = new BZAnimationEngine();
    await this.animationEngine.init(this.canvas);
  }
  
  protected render(): void {
    this.shadow.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="button-container">
        <button class="animated-button">
          <slot></slot>
        </button>
        <canvas class="animation-canvas"></canvas>
      </div>
    `;
    
    // Add event listeners for animations
    const button = this.shadow.querySelector('button')!;
    button.addEventListener('mouseenter', () => {
      this.animationEngine.animateButton(button, 'hover');
    });
    
    button.addEventListener('click', () => {
      this.animationEngine.animateButton(button, 'click');
      // Create celebration particles
      this.animationEngine.createParticleSystem({
        count: 50,
        color: [0.2, 0.6, 1.0, 1.0],
        duration: 1000
      });
    });
  }
}

// Milestone progress with GPU animations
class BZAnimatedMilestoneProgress extends DesignSystemComponent {
  private animationEngine: BZAnimationEngine;
  
  static get observedAttributes() {
    return ['current', 'target', 'animate'];
  }
  
  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (name === 'current' && oldValue !== newValue) {
      this.animateProgressChange(parseInt(oldValue || '0'), parseInt(newValue));
    }
  }
  
  private animateProgressChange(from: number, to: number): void {
    // Smooth GPU-accelerated progress animation
    this.animationEngine.animateMilestoneProgress(from, to);
    
    // Celebration effects when milestone is reached
    if (to >= parseInt(this.getAttribute('target') || '0')) {
      this.triggerMilestoneReachedAnimation();
    }
  }
  
  private triggerMilestoneReachedAnimation(): void {
    // Epic celebration with particles, screen effects
    const particles = this.animationEngine.createParticleSystem({
      count: 200,
      color: [1.0, 0.8, 0.2, 1.0], // Gold particles
      duration: 3000,
      gravity: -0.001,
      spread: Math.PI / 3
    });
  }
}

// Game component visualization with 3D effects
class BZGameComponentCard extends DesignSystemComponent {
  private rotationX = 0;
  private rotationY = 0;
  
  protected render(): void {
    this.shadow.innerHTML = `
      <style>
        .component-card {
          perspective: 1000px;
          transition: transform 0.3s ease;
        }
        
        .card-inner {
          transform-style: preserve-3d;
          transition: transform 0.6s ease;
        }
        
        .card-front, .card-back {
          backface-visibility: hidden;
          position: absolute;
          width: 100%;
          height: 100%;
        }
        
        .card-back {
          transform: rotateY(180deg);
        }
      </style>
      <div class="component-card">
        <div class="card-inner">
          <div class="card-front">
            <slot name="front"></slot>
          </div>
          <div class="card-back">
            <slot name="back"></slot>
          </div>
        </div>
      </div>
    `;
    
    // Add 3D hover effects
    this.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
  }
  
  private handleMouseMove(e: MouseEvent): void {
    const rect = this.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    this.rotationY = (x / rect.width - 0.5) * 30;
    this.rotationX = (y / rect.height - 0.5) * -30;
    
    const cardInner = this.shadow.querySelector('.card-inner') as HTMLElement;
    cardInner.style.transform = `rotateX(${this.rotationX}deg) rotateY(${this.rotationY}deg)`;
  }
  
  private handleMouseLeave(): void {
    const cardInner = this.shadow.querySelector('.card-inner') as HTMLElement;
    cardInner.style.transform = 'rotateX(0deg) rotateY(0deg)';
  }
}

customElements.define('bz-animated-button', BZAnimatedButton);
customElements.define('bz-animated-progress', BZAnimatedMilestoneProgress);
customElements.define('bz-game-component-card', BZGameComponentCard);

// Animation utility functions
class BZAnimations {
  static fadeIn(element: HTMLElement, duration = 300): Promise<void> {
    return new Promise(resolve => {
      element.style.opacity = '0';
      element.style.transform = 'translateY(20px)';
      
      requestAnimationFrame(() => {
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        element.style.opacity = '1';
        element.style.transform = 'translateY(0)';
        
        setTimeout(resolve, duration);
      });
    });
  }
  
  static slideIn(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up'): Promise<void> {
    // GPU-accelerated slide animations
    return new Promise(resolve => {
      // Implementation with WebGPU transforms
    });
  }
  
  static morphBetween(from: HTMLElement, to: HTMLElement): Promise<void> {
    // FLIP animation technique with WebGPU
    return new Promise(resolve => {
      // Implementation
    });
  }
}

interface ParticleConfig {
  count: number;
  color: [number, number, number, number];
  duration: number;
  gravity?: number;
  spread?: number;
}

interface Particle {
  position: [number, number];
  velocity: [number, number];
  life: number;
  size: number;
  color: [number, number, number, number];
}
```

### 5. First Routes to Build
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

## 🔧 Development Philosophy: Minimal & Flexible

### Zero-Dependency Mindset
- **Add dependencies only when absolutely needed**
- **No frameworks/libraries until the feature requires it**
- **Every dependency must justify its bundle size**
- **Prefer vanilla solutions over heavy abstractions**

### Local-First Development
- **Develop entirely offline** - no external services during development
- **Local PostgreSQL** - full control, no API limits or costs
- **Standard protocols** - HTTP, WebSocket, SQL (vendor agnostic)
- **Production flexibility** - deploy to Supabase, Railway, self-hosted, etc.
- **Zero external dependencies** until production deployment

### Performance First
- **Lighthouse 100 scores on all pages**
- **Sub-100ms server response times**
- **Minimal JavaScript bundle sizes**
- **Progressive enhancement over SPA complexity**

### Technical Decisions (Ultra-Minimal Stack)
- **Vite + TypeScript** - Zero framework overhead, lightning-fast dev experience
- **Vanilla Web Components** - Native browser APIs, no React/Vue complexity
- **Node.js + Express** - Simple backend, standard HTTP/WebSocket APIs
- **PostgreSQL** - Direct SQL queries, no ORM bloat
- **Custom Rich Text Editor** - Built specifically for game design on ProseMirror
- **Pure CSS + CSS Custom Properties** - No framework dependencies
- **JWT + bcrypt** - Standard auth, no external services
- **Yjs CRDT** - Conflict-free real-time collaboration

This roadmap gets you from zero to alpha in 12 weeks with **maximum flexibility**, **minimal dependencies**, and **zero vendor lock-in**.
