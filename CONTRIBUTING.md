# Contributing to Open Sunsama

First off, thank you for considering contributing to Open Sunsama! It's people like you that make Open Sunsama such a great tool.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)
- [Community](#community)

## Code of Conduct

This project and everyone participating in it is governed by our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to [ceo@circo.so](mailto:ceo@circo.so).

## Getting Started

### Types of Contributions

There are many ways to contribute:

- **Bug Reports**: Found a bug? Open an issue with detailed reproduction steps
- **Feature Requests**: Have an idea? Start a discussion in GitHub Discussions
- **Code Contributions**: Fix bugs, add features, improve performance
- **Documentation**: Improve README, add tutorials, fix typos
- **Testing**: Write tests, improve coverage, report edge cases
- **Design**: UI/UX improvements, accessibility enhancements
- **Translations**: Help translate the app to other languages

### Good First Issues

Looking for a place to start? Check out issues labeled:

- [`good first issue`](https://github.com/ShadowWalker2014/open-sunsama/labels/good%20first%20issue) - Great for newcomers
- [`help wanted`](https://github.com/ShadowWalker2014/open-sunsama/labels/help%20wanted) - Extra attention needed
- [`documentation`](https://github.com/ShadowWalker2014/open-sunsama/labels/documentation) - Docs improvements

## Development Setup

### Prerequisites

- [Bun](https://bun.sh/) v1.0+ (recommended) or Node.js 20+
- PostgreSQL 15+
- Git

### Setup

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/open-sunsama.git
cd open-sunsama

# 3. Add upstream remote
git remote add upstream https://github.com/ShadowWalker2014/open-sunsama.git

# 4. Install dependencies
bun install

# 5. Set up environment
cp .env.example .env
# Edit .env with your database URL

# 6. Set up the database
bun run db:push

# 7. Start development servers
bun run dev
```

### Project Structure

```
open-sunsama/
├── apps/
│   ├── api/           # Hono REST API
│   ├── web/           # React + Vite SPA
│   ├── desktop/       # Tauri desktop app
│   └── mobile/        # Expo mobile app
├── packages/
│   ├── database/      # Drizzle ORM + schema
│   ├── types/         # Shared TypeScript types
│   ├── api-client/    # HTTP client + React Query
│   └── utils/         # Shared utilities
└── mcp/               # MCP server for AI
```

### Commands

```bash
# Development
bun run dev              # Start all dev servers
bun run dev:web          # Web + API only
bun run dev:desktop      # Desktop + API

# Quality
bun run typecheck        # TypeScript checking
bun run lint             # ESLint
bun run lint:fix         # Fix lint errors
bun run format           # Prettier formatting
bun run test             # Run tests

# Database
bun run db:generate      # Generate migrations
bun run db:push          # Push schema changes
bun run db:studio        # Open Drizzle Studio

# Build
bun run build            # Build all packages
```

## How to Contribute

### Reporting Bugs

Before creating a bug report, please check existing issues. When creating a bug report, include:

1. **Summary**: A clear, concise description
2. **Steps to Reproduce**: Detailed steps to reproduce the issue
3. **Expected Behavior**: What you expected to happen
4. **Actual Behavior**: What actually happened
5. **Environment**: OS, browser, Node version, etc.
6. **Screenshots/Logs**: If applicable

Use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.md).

### Suggesting Features

Feature requests are welcome! Please:

1. Check if the feature already exists or is planned
2. Open a discussion in [GitHub Discussions](https://github.com/ShadowWalker2014/open-sunsama/discussions/categories/ideas)
3. Describe the problem you're trying to solve
4. Explain your proposed solution
5. Consider alternatives you've thought about

### Code Contributions

1. **Find or create an issue** describing what you want to work on
2. **Comment on the issue** to let others know you're working on it
3. **Fork and create a branch** from `main`
4. **Make your changes** following our coding standards
5. **Write/update tests** as needed
6. **Update documentation** if required
7. **Submit a pull request**

## Pull Request Process

### Before Submitting

- [ ] Code compiles without errors (`bun run build`)
- [ ] All tests pass (`bun run test`)
- [ ] No lint errors (`bun run lint`)
- [ ] TypeScript is happy (`bun run typecheck`)
- [ ] Code is formatted (`bun run format`)
- [ ] Documentation is updated (if applicable)
- [ ] Commit messages follow our convention

### PR Guidelines

1. **Keep PRs focused**: One feature or fix per PR
2. **Write a good description**: Explain what and why
3. **Link related issues**: Use "Fixes #123" or "Closes #456"
4. **Add screenshots**: For UI changes
5. **Request review**: Tag relevant maintainers

### Review Process

1. A maintainer will review your PR
2. They may request changes or ask questions
3. Make requested changes in new commits
4. Once approved, a maintainer will merge your PR
5. Your contribution will be in the next release!

## Coding Standards

### TypeScript

- Use TypeScript for all new code
- Avoid `any` type - use `unknown` and type guards
- Export types from `packages/types`
- Use Zod for runtime validation

```typescript
// Good
function processTask(task: Task): ProcessedTask {
  return { ...task, processed: true };
}

// Avoid
function processTask(task: any): any {
  return { ...task, processed: true };
}
```

### React

- Use functional components with hooks
- Colocate related code (component + styles + tests)
- Use TanStack Query for server state
- Use Radix UI for accessible components

```tsx
// Good
export function TaskCard({ task }: { task: Task }) {
  const { mutate: completeTask } = useCompleteTask();

  return (
    <Card>
      <CardTitle>{task.title}</CardTitle>
      <Button onClick={() => completeTask(task.id)}>Complete</Button>
    </Card>
  );
}
```

### API

- Use Hono route handlers
- Validate input with Zod
- Return consistent response shapes
- Handle errors gracefully

```typescript
// Good
app.post("/tasks", zValidator("json", createTaskSchema), async (c) => {
  const data = c.req.valid("json");
  const task = await createTask(data);
  return c.json({ success: true, data: task });
});
```

### Testing

- Write tests for new features
- Test edge cases and error handling
- Use descriptive test names

```typescript
describe("TaskService", () => {
  it("should create a task with default priority P2", async () => {
    const task = await createTask({ title: "Test" });
    expect(task.priority).toBe("P2");
  });

  it("should throw if title is empty", async () => {
    await expect(createTask({ title: "" })).rejects.toThrow();
  });
});
```

## Commit Messages

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation only
- `style`: Formatting, no code change
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvement
- `test`: Adding tests
- `chore`: Maintenance tasks

### Examples

```bash
feat(tasks): add subtask support
fix(api): handle null scheduledDate in task creation
docs(readme): update installation instructions
refactor(web): extract TaskCard into separate component
```

### Scope

Use the package or app name:

- `api`, `web`, `desktop`, `mobile`
- `database`, `types`, `api-client`, `utils`
- `mcp`
- `ci`, `deps`, `config`

## Community

- **GitHub Discussions**: Questions, ideas, show & tell
- **GitHub Issues**: Bug reports, feature requests

## Recognition

Contributors are recognized in:

- The README contributors section
- Release notes for their contributions
- Our website's contributors page

## Questions?

Don't hesitate to ask! Open a discussion or reach out to maintainers.

---

Thank you for contributing to Open Sunsama!
