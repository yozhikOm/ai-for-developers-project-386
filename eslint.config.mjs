// @ts-check
import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores(["**/dist", "**/node_modules"]),
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
  {
    files: ["apps/web/**/*.{ts,tsx}"],
    extends: [reactHooks.configs.flat.recommended],
  },
  // Всегда последним: отключает правила ESLint, конфликтующие с Prettier
  prettier,
]);
