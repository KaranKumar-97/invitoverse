import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const restrict = (patterns) => ({
  "no-restricted-imports": ["error", { patterns }],
});

// Folder boundaries — see docs/12-folder-structure.md
const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      "react/no-danger": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["src/templates/**", "src/invitation-kit/**"],
    rules: restrict([
      {
        group: ["@/server/*", "@/server/**"],
        message: "Templates/kit must not import server code.",
      },
      {
        group: ["@prisma/client", "@prisma/*"],
        message: "Templates/kit must not touch the database.",
      },
      { group: ["@/components/dashboard/**"], message: "Templates must not use dashboard UI." },
      {
        regex: "^zod(/.*)?$",
        message: 'Browser-reachable code imports z from "@/lib/zod" (jitless; CSP-safe).',
      },
    ]),
  },
  {
    files: ["src/lib/**"],
    rules: restrict([
      {
        group: ["@/server/*", "@/server/**"],
        message: "src/lib is isomorphic; it must not import server code.",
      },
      {
        regex: "^zod(/.*)?$",
        message: 'Browser-reachable code imports z from "@/lib/zod" (jitless; CSP-safe).',
      },
    ]),
  },
  {
    files: ["src/app/**", "src/components/**", "src/middleware.ts"],
    rules: restrict([
      {
        group: ["@prisma/client"],
        allowTypeImports: true,
        message: "Use services in src/server/services, not Prisma directly.",
      },
      {
        group: ["@/server/db/*"],
        message: "Use services in src/server/services, not the DB client directly.",
      },
    ]),
  },
  {
    files: ["src/server/services/**"],
    rules: restrict([
      {
        group: ["next/navigation", "next/headers", "react", "react-dom"],
        message: "Services must stay framework-agnostic.",
      },
    ]),
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      ".next-build/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "playwright-report/**",
      "test-results/**",
      "src/components/ui/**",
    ],
  },
];

export default eslintConfig;
