import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      ".tmp/**",
      "dist/**",
      "artifacts/**",
      "node_modules/**",
      "public/_locales/**"
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: [
      "src/**/*.ts",
      "tests/**/*.ts",
      "scripts/**/*.mjs",
      "vite.config.ts",
      "vitest.config.ts"
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
        browser: "readonly"
      }
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_" }
      ]
    }
  }
);
