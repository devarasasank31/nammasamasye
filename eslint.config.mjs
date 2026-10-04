import { readFileSync } from "node:fs";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

// eslint-config-next sets settings.react.version to "detect", which makes
// eslint-plugin-react resolve the React version from the linted file's
// context. That helper still calls context.getFilename(), removed in
// ESLint 10, so detection crashes every run. Pinning the version from
// package.json skips detection entirely and never drifts from the
// installed React.
const reactVersion = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
).dependencies.react;

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    settings: { react: { version: reactVersion } },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
          // Siblings of an object rest pattern are deliberate omissions
          // (e.g. `const { secret, ...public } = row`).
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Compiled eval/debug harness output (scripts/tsconfig.eval.json).
    ".eval-build/**",
  ]),
]);

export default eslintConfig;
