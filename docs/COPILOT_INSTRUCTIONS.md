# GitHub Copilot Custom Instructions

## Overview

This document explains the GitHub Copilot custom instructions that have been added to the AnimeList Chrome Extension project to improve code generation quality and consistency.

## What Was Added

### 📄 Repository Custom Instructions

**File**: `.github/copilot-instructions.md`

This file contains repository-wide instructions that tell GitHub Copilot about:

- **Project Architecture**: Vue 3, TypeScript, Tailwind CSS v4, Chrome extension structure
- **Framework Conventions**: Composition API, `<script setup>` syntax, glass-morphism design
- **File Organization**: Chrome extension folder structure, naming conventions
- **Storage & State**: Chrome local storage utilities, reactive state patterns
- **Testing Requirements**: 100% coverage, data-testid attributes, Chrome API mocking
- **UI Design Standards**: Anime branding, purple-pink gradients, responsive design
- **Code Style & Formatting**: ESLint/Prettier rules, double quotes, 4-space indentation
- **Development Workflow**: Build commands, linting, testing practices

### 📁 Prompt Files

**Location**: `.github/prompts/`

Created three reusable prompt files for common development tasks:

#### 1. **New Vue Component.prompt.md**

- Guides creation of Vue components following project standards
- Covers Vue 3 Composition API, TypeScript, glass-morphism design
- Includes testing requirements and file organization

#### 2. **Write Tests.prompt.md**

- Templates for comprehensive unit testing
- Chrome API mocking patterns, Vitest configuration
- Coverage requirements and Vue component testing

#### 3. **Storage Utility.prompt.md**

- Patterns for Chrome storage utility functions
- Error handling, TypeScript types, performance considerations
- Testing and validation requirements

## How It Works

### Repository Custom Instructions

- **Automatic**: Applied to all Copilot interactions in this repository
- **Invisible**: No visible UI, but appears in Copilot's References list
- **Context**: Provides project-specific context for better code generation

### Prompt Files

- **On-Demand**: Attach to specific Copilot chat prompts when needed
- **Reusable**: Shareable templates for common development tasks
- **Contextual**: Include references to project documentation and files

## Usage

### Enabling Custom Instructions

Custom instructions are enabled by default in VS Code. To verify:

1. Open VS Code Settings (`Cmd/Ctrl + ,`)
2. Search for "instruction file"
3. Ensure "Code Generation: Use Instruction Files" is checked

### Using Prompt Files

1. In Copilot Chat, click the attach context icon (📎)
2. Select "Prompt..." and choose the relevant prompt file
3. Add any additional context or specific requirements
4. Submit your chat prompt

### Examples

**Creating a new Vue component**:

1. Attach "New Vue Component.prompt.md"
2. Ask: "Create a new UserStats component for displaying anime statistics"

**Writing tests**:

1. Attach "Write Tests.prompt.md"
2. Ask: "Create tests for the episodeProgressUtil.ts file"

**Creating storage utilities**:

1. Attach "Storage Utility.prompt.md"
2. Ask: "Create a favoriteAnimeUtil for managing favorite anime lists"

## Benefits

- **Consistency**: All generated code follows project conventions automatically
- **Quality**: Copilot understands our architecture, design patterns, and requirements
- **Efficiency**: Less time explaining project context in each interaction
- **Team Onboarding**: New team members get consistent Copilot assistance
- **Best Practices**: Enforces testing, accessibility, and performance standards

## Verification

All functionality verified after adding instructions:

- ✅ Dev server running (`npm run dev`)
- ✅ Tests passing with 100% coverage (`npm run test:unit:coverage`)
- ✅ Build succeeding (`npm run build:ext`)
- ✅ All project functionality intact

The custom instructions enhance development workflow without affecting existing code or functionality.
