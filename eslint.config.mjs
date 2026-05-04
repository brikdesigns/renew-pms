import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // These @eslint-react rules flag intentional patterns used throughout the codebase:
      // - Sheet components reset state in effects when their data prop changes (correct pattern)
      // - window.location.href assignment is an intentional hard-reload for session refresh
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/immutability': 'off',
      // Allow underscore-prefixed unused vars/args/destructures so that
      // intentionally-reserved props (e.g. `_isAdmin` reserved for future
      // admin-only actions) and ignored callback args don't trip the rule.
      '@typescript-eslint/no-unused-vars': ['warn', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
      }],
      // Fail-loud guardrails — no silent failures
      'no-empty': ['error', { allowEmptyCatch: false }],
      '@typescript-eslint/no-non-null-assertion': 'error',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
