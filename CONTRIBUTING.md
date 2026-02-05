# Contributing to MCP Forge

Thanks for your interest in contributing to MCP Forge! Here's how to get started.

## Development Setup

1. Fork and clone the repo
2. Run `npm install`
3. Run `npm run dev` to start the development server
4. Make your changes
5. Run `npm run type-check` to verify TypeScript
6. Submit a pull request

## What to Contribute

- **New registry servers** — Add real MCP servers to `src/lib/registry.ts`
- **Code generation improvements** — Enhance `src/lib/codegen.ts` with better patterns
- **Python SDK output** — Add Python code generation alongside TypeScript
- **UI improvements** — Better editor components, keyboard shortcuts, dark mode refinements
- **Documentation** — Improve README, add JSDoc comments, create tutorials

## Code Style

- TypeScript strict mode
- Functional components with hooks
- IBM Plex Mono for all UI text
- Follow existing patterns in the codebase

## Commit Messages

Use conventional commits:
- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation
- `refactor:` for code improvements
- `style:` for formatting changes
