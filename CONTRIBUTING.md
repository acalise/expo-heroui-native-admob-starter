# Contributing

Thanks for your interest in contributing! Here's how you can help.

## Reporting Bugs

Open a [GitHub issue](https://github.com/acalise/expo-heroui-native-admob-starter/issues) with:

- A clear title and description
- Steps to reproduce the problem
- Expected vs. actual behavior
- Your environment (OS, Expo SDK version, device/simulator)

## Suggesting Features

Open a [GitHub issue](https://github.com/acalise/expo-heroui-native-admob-starter/issues) and tag it as a feature request. Describe the use case and why it would be useful for a starter template.

## Submitting Pull Requests

1. **Fork** the repo and clone your fork
2. **Create a branch** from `main` with a descriptive prefix:
   - `feat/your-feature` for new features
   - `fix/what-you-fixed` for bug fixes
3. **Make your changes** and test them on at least one platform (iOS or Android)
4. **Use conventional commits** for your commit messages:
   - `feat: add bottom sheet support`
   - `fix: dark mode flash on launch`
   - `docs: update AdMob setup instructions`
5. **Keep PRs focused** — one feature or fix per PR
6. **Open a Pull Request** against `main` with a clear description of what changed and why

## Code Style

- **TypeScript** with strict mode — no `any` types unless absolutely necessary
- Follow existing patterns in the codebase for file structure and naming
- Use `className` props and Tailwind utilities for styling (via Uniwind)
- Run `npm run type-check` before submitting to catch type errors
- Run `npm run lint` to check for lint issues
