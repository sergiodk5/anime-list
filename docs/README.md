# Documentation

This folder contains comprehensive guides and documentation for the Anime List Chrome Extension project.

## Available Guides

### [Project Structure Guide](./PROJECT_STRUCTURE.md)

Comprehensive guide explaining the architecture and organization of the Chrome extension project. Covers:

- Chrome extension architecture overview
- Purpose and meaning of each `src/` folder (background, content, popup, options, commons)
- Cross-component communication patterns
- Development guidelines and best practices
- File naming conventions and folder-specific rules
- Testing strategies per component type

### [Testing Guide](./TESTING_GUIDE.md)

Comprehensive guide for new team members to understand our testing strategy, tools, and best practices. Covers:

- Testing stack and tools (Vitest, V8 coverage, Chrome API mocking)
- Project structure and test organization
- Writing effective unit tests
- Coverage requirements and standards
- Best practices and common pitfalls
- Debugging and troubleshooting
- Code review guidelines

### [UI Design Guide](./UI_DESIGN_GUIDE.md)

Complete design system documentation for maintaining consistent anime-themed UI across the extension. Covers:

- 🎨 Glass-morphism design patterns and component guidelines
- 🎌 Anime branding with Darkness (KonoSuba) icon system
- 📱 Responsive design strategies and mobile-first approach
- 🧪 Testing requirements with comprehensive data-testid patterns
- 🎨 Color palette, typography, and animation guidelines
- ✅ Implementation checklists and maintenance procedures

### [Options Guide](./OPTIONS_GUIDE.md)

Comprehensive guide for developing and extending the Chrome extension options page. Covers:

- 🏗️ Complete options page architecture and file structure
- 🎯 Component breakdown and development patterns
- 🧭 Vue Router integration and navigation system
- 📊 Dashboard features and watch list management
- 🎨 Glass-morphism styling and anime theming
- 🧪 Testing strategies and data-testid guidelines

### [GitHub Copilot Instructions](./COPILOT_INSTRUCTIONS.md)

Guide to the custom GitHub Copilot instructions that enhance code generation for this project. Covers:

- 📄 Repository-wide custom instructions for consistent code generation
- 📁 Reusable prompt files for common development tasks
- 🎯 Project-specific conventions and architecture guidance
- ✅ Usage examples and verification procedures
- 🛠️ Benefits for development workflow and team onboarding
- 🚀 Performance considerations and future expansion plans

### [Popup Guide](./POPUP_GUIDE.md)

Detailed documentation for the popup component development and functionality. Covers popup architecture, features, and implementation details.

## Getting Started

If you're new to the project:

1. Start with the [Project Structure Guide](./PROJECT_STRUCTURE.md) to understand the overall architecture and folder organization
2. Read the [UI Design Guide](./UI_DESIGN_GUIDE.md) to understand our anime-themed design patterns and component guidelines
3. For popup development, review the [Popup Guide](./POPUP_GUIDE.md)
4. For options page development, review the [Options Guide](./OPTIONS_GUIDE.md)
5. Then read the [Testing Guide](./TESTING_GUIDE.md) to understand how to write and run tests for the codebase

### For Options Page Development

Before working on the options page:

1. **Review the [Options Guide](./OPTIONS_GUIDE.md)** for complete architecture overview
2. **Check the [UI Design Guide](./UI_DESIGN_GUIDE.md)** for styling patterns
3. **Follow Vue Router patterns** for navigation and routing
4. **Use glass-morphism styling** consistently
5. **Include comprehensive data-testid attributes** for testing
6. **Maintain 100% test coverage** for all components

## Contributing to Documentation

When adding new documentation:

1. Create clear, comprehensive guides with practical examples
2. Include both conceptual explanations and hands-on code samples
3. Update this README to reference new documentation
4. Keep documentation up-to-date with code changes
