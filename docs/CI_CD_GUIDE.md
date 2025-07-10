# CI/CD Pipeline

## Overview

This document explains the Continuous Integration and Continuous Deployment (CI/CD) pipeline for the AnimeList Chrome Extension project using GitHub Actions.

## Workflows

### 🔧 CI Workflow (`.github/workflows/ci.yml`)

**Triggers:**

- Push to `main`, `master`, or `develop` branches
- Pull requests to `main`, `master`, or `develop` branches
- Manual dispatch

**Jobs:**

#### 1. **Tests Job**

- Runs on Ubuntu latest
- Installs Node.js 20 and dependencies
- Executes unit tests with coverage (`npm run test:unit:coverage`)
- Uploads coverage reports to Codecov (requires `CODECOV_TOKEN` secret)

#### 2. **Code Quality Job** (depends on tests)

- TypeScript type checking (`npm run type-check`)
- ESLint linting check (`npm run lint:check`)
- Prettier formatting check (`npm run format:check`)

#### 3. **Build Job** (depends on tests and code-quality)

- Builds the Chrome extension (`npm run build:ext`)
- Uploads build artifacts for 30 days

#### 4. **E2E Tests Job** (depends on build)

- Installs Playwright browsers
- Runs end-to-end tests (`npm run test:e2e`)
- Uploads Playwright test reports

### 🚀 Release Workflow (`.github/workflows/release.yml`)

**Triggers:**

- Push of version tags (e.g., `v1.0.0`)
- Manual dispatch with version input

**Process:**

1. Runs all quality checks (tests, linting, formatting, type checking)
2. Builds the Chrome extension
3. Creates a ZIP archive of the extension
4. Creates a GitHub release with the extension package
5. Provides installation instructions

## Package.json Scripts

### Development Scripts

- `npm run dev` - Start development server with hot-reload
- `npm run build:ext` - Build complete Chrome extension package
- `npm run test:unit:watch` - Run tests in watch mode

### CI/CD Scripts

- `npm run test:unit:coverage` - Run tests with coverage reports
- `npm run type-check` - TypeScript type checking
- `npm run lint:check` - ESLint without auto-fixing (CI-safe)
- `npm run format:check` - Prettier formatting check (CI-safe)

### Quality Assurance Scripts

- `npm run lint` - ESLint with auto-fixing (development)
- `npm run format` - Prettier with auto-formatting (development)

## Setup Requirements

### Repository Secrets

To fully utilize the CI/CD pipeline, add these secrets in GitHub repository settings:

1. **`CODECOV_TOKEN`** (Optional)
    - For code coverage reporting
    - Get token from [codecov.io](https://codecov.io/)
    - Navigate to: Settings → Secrets and variables → Actions → New repository secret

### Node.js Version

The workflows use Node.js 20 (LTS). This is specified in the workflow files and should match the development environment.

### Browser Support

E2E tests run on Ubuntu with Playwright, which tests Chromium, Firefox, and WebKit engines for cross-browser compatibility.

## Workflow Features

### ✅ **Quality Gates**

- All tests must pass before deployment
- Code must pass linting and formatting checks
- TypeScript compilation must succeed
- Build process must complete successfully

### 📊 **Coverage Reporting**

- Automatic code coverage collection
- Coverage reports uploaded to Codecov
- Coverage thresholds enforced in vitest.config.ts

### 🔄 **Artifact Management**

- Build artifacts stored for 30 days
- Playwright test reports for debugging
- Release packages for distribution

### 🏷️ **Release Automation**

- Automatic GitHub releases on version tags
- Packaged Chrome extension ready for installation
- Release notes with installation instructions

## Development Workflow

### Before Committing

```bash
# Run quality checks locally
npm run lint:check
npm run format:check
npm run type-check
npm run test:unit:coverage
```

### Creating a Release

1. Update version in `package.json`
2. Create and push a version tag:
    ```bash
    git tag v1.0.0
    git push origin v1.0.0
    ```
3. Release workflow will automatically create GitHub release

### Manual Release

1. Go to Actions tab in GitHub
2. Select "Release" workflow
3. Click "Run workflow"
4. Enter version number (e.g., `v1.0.0`)

## Monitoring

### CI Status

- Check the Actions tab for workflow runs
- All PRs show CI status checks
- Failed workflows prevent merging (when branch protection is enabled)

### Coverage Tracking

- Coverage reports available in Codecov dashboard
- Coverage changes shown in PR comments
- Maintain 100% coverage for utility functions

## Troubleshooting

### Common Issues

**TypeScript Version Warning:**

- ESLint may show warnings about TypeScript version compatibility
- This is informational and doesn't block the workflow

**E2E Test Failures:**

- Check Playwright reports in workflow artifacts
- Tests may fail due to timing or browser compatibility
- Retry failed workflows if issues seem transient

**Build Failures:**

- Check that all dependencies are properly installed
- Ensure no syntax errors in source code
- Verify that all imports are correctly resolved

### Debug Steps

1. Check workflow logs in GitHub Actions
2. Run failing commands locally: `npm run [script-name]`
3. Verify all dependencies are in `package.json`
4. Check for any configuration changes needed
