# Budget Zero

A minimal, fast collaborative game design platform with zero upfront investment.

## 🎯 Philosophy

- **Minimal**: Only what you actually need, nothing more
- **Fast**: Lightweight, no bloat, instant loading
- **Simple**: Easy to understand, modify, and extend
- **Flexible**: No vendor lock-in, easy to pivot

## 🏗️ Project Structure

```
BudgetZero/
├── web/                 # Frontend (Vite + TypeScript + JSX)
│   ├── src/            # Source code
│   │   ├── components/ # React-like components
│   │   ├── types/      # Auto-generated TypeScript types
│   │   └── utils/      # Auto-generated API client
│   ├── package.json    # Frontend dependencies
│   └── tsconfig.json   # TypeScript config
├── backend/            # Backend (Go + Fiber + GORM + PostgreSQL)
│   ├── main.go         # Server source code
│   ├── go.mod          # Go module dependencies
│   ├── cmd/generate/   # TypeScript SDK generator
│   ├── Makefile        # Go development commands
│   └── .env            # Environment variables
├── BUILD_ROADMAP.md    # Development roadmap
└── PLAN.md            # Project overview
```

## 🚀 Quick Start (5 minutes)

### **Prerequisites**
- **Go 1.21+** - [Download here](https://golang.org/dl/)
- **PostgreSQL 14+** - `brew install postgresql@14`
- **Node.js 18+** - [Download here](https://nodejs.org/)

### **Setup Commands**
```bash
# 1. Start PostgreSQL
brew services start postgresql@14

# 2. Install frontend dependencies
cd web && npm install

# 3. Generate TypeScript SDK & start backend
cd ../backend && make generate && go run main.go

# 4. Start frontend (new terminal)
cd web && npm run dev
```

**That's it!** Your app will be running at:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001

## 🧪 Test the App

**Demo Invite Codes:**
- `CREATOR2024` - For creators
- `CONTRIB2024` - For contributors  
- `VIP2024` - For VIP users
- `GENERAL2024` - For general users

**Test Flow:**
1. Go to http://localhost:5173
2. Use any email + valid invite code
3. Navigate between landing, auth, dashboard, and projects

## 🔧 Development Commands

### **Frontend (web/)**
```bash
cd web
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build
npm run lint            # TypeScript check
```

### **Backend (backend/)**
```bash
cd backend
make generate           # Generate TypeScript SDK
make dev                # Start Go development server
make build              # Build Go binary
make test               # Run Go tests
make setup              # Full setup (deps + generate + dev)
```

### **Database**
```bash
brew services start postgresql@14  # Start PostgreSQL
brew services stop postgresql@14   # Stop PostgreSQL
```

## 🔄 Auto-Generated TypeScript SDK

The project automatically generates a TypeScript SDK from the Go backend:

- **Types**: `web/src/types/api.ts` - Auto-generated interfaces matching Go structs
- **API Client**: `web/src/utils/apiClient.ts` - Auto-generated HTTP client for all endpoints
- **Regeneration**: Run `cd backend && make generate` after backend changes

**Benefits:**
- **Type Safety**: Frontend and backend types are always in sync
- **Auto-completion**: Full IntelliSense support in your editor
- **No Manual Updates**: Types automatically reflect backend changes
- **Consistency**: Eliminates type mismatches between frontend and backend

## 🗄️ Database Features

- **Auto-migration**: GORM automatically creates tables based on Go structs
- **Auto-seeding**: Demo data automatically populated on first run
- **Demo Users**: admin@budgetzero.dev, creator@budgetzero.dev, artist@budgetzero.dev, writer@budgetzero.dev
- **Demo Projects**: Cosmic Explorers, Dragon Keepers, Steampunk Adventures

## 🚫 What We Avoid

- Premature optimization
- Complex state management
- Over-abstracted components
- External dependencies unless absolutely necessary
- Shadow DOM for simple UI elements
- Mixing package managers (npm for Go projects)
- ORMs that aren't idiomatic to the language (Prisma in Go)
- Manual type synchronization between frontend and backend

## 🆕 What Changed

- **Restructured**: Clear separation between frontend (web/) and backend (backend/)
- **Modernized**: Backend now uses Go with Fiber framework instead of Node.js
- **Simplified**: No root-level package management, each project manages its own dependencies
- **Performance**: Go backend provides significantly better performance than Node.js
- **Clean**: Proper separation of concerns with appropriate tools for each language
- **Native**: Uses GORM (Go's most popular ORM) instead of Prisma
- **Auto-SDK**: TypeScript types and API client automatically generated from Go backend

## 🚀 Why Go?

- **Performance**: Much faster than Node.js/Python
- **Simplicity**: Clean, readable syntax
- **Concurrency**: Excellent for handling multiple requests
- **Memory**: Lower memory usage than Node.js
- **Deployment**: Single binary deployment
- **Ecosystem**: Rich ecosystem for web services
- **Dependencies**: Built-in module system with `go.mod`
- **Database**: GORM provides excellent PostgreSQL support with auto-migration
- **Code Generation**: Excellent tooling for generating code from Go source
