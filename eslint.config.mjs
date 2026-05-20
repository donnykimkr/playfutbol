import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    ".vercel/**",
    "dist/**",
    "next-env.d.ts",
    "src/main.jsx",
    "src/styles.css",
    "src/supabase.js",
    "scripts/**",
    "vite.config.js",
  ]),
]);
