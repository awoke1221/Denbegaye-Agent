# Denbegnaye - AI-Powered Digital Agency Toolkit

Denbegnaye is a professional AI-powered digital Agency toolkit designed for creators and businesses owners. which Automates the degital ai agent creations and workflows with an intuitive visual builder.

## Architecture Overview

```mermaid
graph TB
    A[User Interface] --> B[Next.js App Router]
    B --> C[API Routes]
    C --> E[External APIs]
    B --> F[Client Components]
    F --> G[Zustand Stores]
    F --> H[React Contexts]
    D --> K[Authentication]
    D --> L[Data Storage]
```

The application follows a modular architecture with clear separation of concerns:

- **Frontend**: React components with TypeScript for type safety
- **Backend**: Serverless API routes handling business logic
- **Database**: Supabase PostgresSQL
- **State Management**: Zustand for local state, React Context for global state

## 🚀 Features

- **AI Agent Builder**: Create intelligent multi-step workflows with a drag-and-drop interface

## � API Documentation

The application provides RESTful API endpoints for all major features. All endpoints require authentication via Supabase Auth.

### Authentication

All API requests must include an `Authorization: Bearer <token>` header with a valid token.

### Key Endpoints

#### Agent Management

- `POST /api/agent-run` - Execute an agent workflow
- `GET /api/agent-workflows` - List user workflows
- `POST /api/agent-workflows` - Create new workflow

### Response Format

All endpoints return JSON responses with consistent structure:

```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

Error responses:

```json
{
  "success": false,
  "data": null,
  "error": "Error message"
}
```

## 📋 Prerequisites

- Node.js 18+
- npm

## 🚀 Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/denbegnaye.git
   cd denbegnaye
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   # Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

   ```

4. **Run the development server**

   ```bash
   npm dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
denbegnaye/
├── app/                          # Next.js app router pages and layouts
│   ├── api/                      # Serverless API routes
│   │   ├── agent-run/            # Agent execution endpoints
│   │   └── ...                   # Other feature APIs
│   ├── agent-builder/            # Agent workflow builder page
│   ├── dashboard/                # Analytics dashboard
│   ├── login/                    # Authentication pages
│   ├── layout.tsx                # Root layout with providers
│   └── page.tsx                  # Home page
├── components/                   # React components organized by feature
│   ├── agent-nodes/              # Visual nodes for agent builder
│   ├── auth/                     # Authentication components
│   ├── ui/                       # Reusable UI primitives (Radix UI)
│   ├── error-boundary.tsx        # Global error handling
│   ├── loading-state.tsx         # Loading indicators
│   └── theme-provider.tsx        # Theme management
├── lib/                          # Core business logic and utilities
│   ├── agentEngine.ts            # Agent execution engine
│   ├── executionEngine.ts        # Workflow execution logic
│   ├── utils.ts                  # Helper functions
│   └── encryption.ts             # Data encryption utilities
├── stores/                       # Zustand state management
│   └── agentBuilderStore.ts      # Agent builder state
├── types/                        # TypeScript type definitions
│   └──
├── constants/                    # Application constants and config
├── contexts/                     # React context providers
│   └── AuthContext.tsx           # Authentication context
├── hooks/                        # Custom React hooks
├── public/                       # Static assets and icons
├── styles/                       # Global styles
├── __tests__/                    # Test files and setup
└── config/                       # Configuration files
```

### Code Organization Principles

- **Feature-based structure**: Components and APIs are grouped by business domain
- **Separation of concerns**: UI, business logic, and data access are clearly separated
- **Reusability**: Common components are in `ui/`, utilities in `lib/`
- **Type safety**: Comprehensive TypeScript types for all data structures
- **Error handling**: Centralized error boundaries and consistent error patterns
  │ ├──
  │ ├── utils.ts # Helper functions
  │ └── encryption.ts # Encryption utilities
  ├── services/ # Business logic services
  ├── stores/ # Zustand state stores
  ├── types/ # TypeScript type definitions
  ├── constants/ # Application constants
  ├── contexts/ # React contexts
  ├── hooks/ # Custom React hooks
  └── public/ # Static assets

````

## 🧪 Development

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Next.js recommended rules with Prettier integration
- **Prettier**: Consistent code formatting
- **JSDoc**: Comprehensive documentation for all public APIs

### Development Scripts

```bash
# Development server
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix

# Code formatting
npm run format
npm run format:check

# Testing
npm run test
npm run test:watch
npm run test:coverage

# Build analysis
npm run analyze
````

### Testing Strategy

Tests are organized in `__tests__/` with setup in `setup.ts`. We use:

- **Jest** for unit and integration tests
- **React Testing Library** for component testing
- **@testing-library/jest-dom** for DOM assertions

Example test structure:

```
__tests__/
├── components/
│   └── Button.test.tsx
├── lib/
│   └── utils.test.ts
└── api/
    └── campaigns.test.ts
```

### Code Style Guidelines

- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **File naming**: kebab-case for components (e.g., `user-profile.tsx`)
- **Imports**: Group by external libraries, then internal modules
- **Error handling**: Use try-catch with specific error types
- **Comments**: JSDoc for functions, inline comments for complex logic

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push

### Manual Build

```bash
# Build for production
npm build

# Start production server
npm start
```

## 🔒 Security

- All API keys are stored as environment variables
- Supabase security rules protect database access
- Input validation with Zod schemas
- HTTPS enforced in production
- Security headers configured

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Workflow

1. **Fork and Clone**

   ```bash
   git clone https://github.com/your-username/denbegnaye.git
   cd denbegnaye
   ```

2. **Set up development environment**

   ```bash
   npm install
   cp .env.example .env.local  # Configure environment variables
   npm run dev
   ```

3. **Create feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Development standards**
   - Write tests for new features
   - Ensure all tests pass: `npm run test`
   - Check code quality: `npm run lint && npm run type-check`
   - Format code: `npm run format`

5. **Commit guidelines**
   - Use conventional commits: `feat:`, `fix:`, `docs:`, `refactor:`
   - Keep commits focused and descriptive

6. **Submit PR**
   - Ensure PR description explains the change and includes screenshots if UI-related
   - Link related issues
   - Request review from maintainers

### Code Review Process

- All PRs require at least one approval
- CI checks must pass (lint, test, type-check)
- Maintainers may request changes for style or functionality
- Squash merge for clean history

### Adding New Features

1. **Plan the feature**: Create an issue with detailed requirements
2. **API design**: Define API endpoints and data structures first
3. **Component structure**: Plan component hierarchy and state management
4. **Testing**: Write tests before implementation
5. **Documentation**: Update README and add JSDoc comments

### Reporting Issues

- Use GitHub Issues with detailed descriptions
- Include steps to reproduce, expected vs actual behavior
- Add screenshots for UI issues
- Specify browser/OS for frontend issues

## 📝 License

This project is licensed under Denbegnaye PLC - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, email support@denbegnaye.com or join our Discord community.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [Radix UI](https://www.radix-ui.com/)
- Icons from [Lucide React](https://lucide.dev/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)
