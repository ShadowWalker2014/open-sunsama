// @ts-check
import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "**/node_modules/**",
      "**/dist/**",
      "**/build/**",
      "**/.turbo/**",
      "**/coverage/**",
      "**/.next/**",
      "**/routeTree.gen.tsx",
    ],
  },
  {
    files: ["apps/expo-mobile/{babel,metro}.config.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: {
        __dirname: "readonly",
      },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    files: ["apps/web/public/sw.js"],
    languageOptions: {
      globals: {
        clients: "readonly",
        console: "readonly",
        self: "readonly",
      },
    },
  },
  {
    files: [
      "apps/web/scripts/generate-blog-covers.mjs",
      "apps/web/scripts/qa-blog.mjs",
    ],
    languageOptions: {
      globals: {
        URL: "readonly",
        console: "readonly",
        document: "readonly",
        PerformanceObserver: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        window: "readonly",
      },
    },
  },
  {
    rules: {
      // Added to ESLint's recommended preset in v10; retain the existing lint baseline.
      "no-useless-assignment": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          fixStyle: "inline-type-imports",
        },
      ],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  }
);
