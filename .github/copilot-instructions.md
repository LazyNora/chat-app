# Copilot Instructions for chat-app

## Project Overview

- Next.js App Router project using TypeScript and shadcn/ui for UI components.
- Main logic in `app/`. UI primitives in `components/ui/`. Auth forms in `components/auth/`.
- Firebase (see `lib/firebase/`) for authentication and user data. No server-side DB.

## Key Architectural Patterns

- **App Router**: Pages in `app/`, including auth routes: `/login`, `/signup`, `/forgot-password` (see `app/(auth)/*/page.tsx`).
- **Component Structure**: UI primitives (Button, Card, etc.) in `components/ui/`. Auth forms: `login-form.tsx`, `signup-form.tsx`, `forgot-password-form.tsx`.
- **Context & Hooks**: User state via React Context and custom hook (`hooks/useFirebaseAuth.tsx`).
- **Firebase Integration**: Auth logic in `lib/firebase/auth.ts` and config in `lib/firebase/firebase.ts`.

## Developer Workflows

- **Start Dev Server**: `pnpm dev` (or `npm/yarn/bun dev`).
- **UI Additions**: `npx shadcn@latest add <component>` for new UI primitives.
- **TypeScript**: All code is TS. Type safety enforced via `tsconfig.json`.
- **Linting**: `pnpm lint` (see `eslint.config.mjs`).

## Project-Specific Conventions

- **Component Naming**: PascalCase, colocated by type in `components/ui/`.
- **Auth Flow**: Auth forms use context/hooks for state and Firebase. Google sign-in/sign-up via `signInWithGoogle` in `lib/firebase/auth.ts`.
- **Routing**: Auth pages in `app/(auth)/login`, `app/(auth)/signup`, `app/(auth)/forgot-password`.
- **Styling**: Global styles in `app/globals.css`. shadcn/ui conventions for components.

## Integration Points

- **Firebase**: Auth and user data via `lib/firebase/`. Google sign-in/sign-up supported.
- **shadcn/ui**: UI primitives in `components/ui/`.

## Examples

- Login: `components/auth/login-form.tsx` (Google/email), route: `/login`
- Sign up: `components/auth/signup-form.tsx` (Google/email), route: `/signup`
- Forgot password: `components/auth/forgot-password-form.tsx`, route: `/forgot-password`
- User context: `hooks/useFirebaseAuth.tsx`

## References

- Main entry: `app/page.tsx`
- Auth: `components/auth/*form.tsx`, `hooks/useFirebaseAuth.tsx`, `lib/firebase/auth.ts`, `lib/firebase/firebase.ts`
- UI: `components/ui/`

---

If any section is unclear or missing important project-specific details, please provide feedback to improve these instructions.
