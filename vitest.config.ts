import { fileURLToPath } from "node:url";
import { configDefaults, defineConfig, mergeConfig } from "vitest/config";
import viteConfig from "./vite.config";

export default mergeConfig(
    viteConfig,
    defineConfig({
        test: {
            environment: "jsdom",
            // Include test files from the test directory
            include: ["test/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
            exclude: [...configDefaults.exclude, "e2e/**"],
            root: fileURLToPath(new URL("./", import.meta.url)),
            // Global setup for mocking Chrome APIs in tests
            globals: true,
            // Setup files for test environment
            setupFiles: ["test/setup.ts"],
            // Test reliability settings
            testTimeout: 10000, // 10 seconds timeout for individual tests
            hookTimeout: 10000, // 10 seconds timeout for hooks
            bail: 5, // Stop after 5 test failures
            // Clear mocks before each test for better isolation
            clearMocks: true,
            mockReset: false,
            restoreMocks: true,
            // Coverage configuration using v8 provider
            coverage: {
                provider: "v8",
                enabled: false, // Enable via CLI flag --coverage
                reporter: ["text", "json", "html"],
                reportsDirectory: "./coverage",
                include: [
                    "src/commons/**/*.{js,ts,vue}",
                    "src/popup/**/*.{js,ts,vue}",
                    "src/options/**/*.{js,ts,vue}",
                    "src/content/**/*.{js,ts,vue}",
                    "!src/**/*.d.ts",
                ],
                exclude: [
                    "src/commons/utils/index.ts", // Simple export file
                    "src/commons/services/index.ts", // Simple export file
                    "src/popup/index.ts", // Simple entry point
                    "src/options/index.ts", // Simple entry point
                    "src/options/router/index.ts", // Simple router setup
                ],
                thresholds: {
                    // Set realistic thresholds for the utilities we're testing
                    functions: 85,
                    lines: 85,
                    branches: 80,
                    statements: 85,
                },
                all: true,
                clean: true,
                cleanOnRerun: true,
                skipFull: false, // Show files with 100% coverage
                reportOnFailure: true, // Generate coverage even when tests fail
            },
        },
    }),
);
