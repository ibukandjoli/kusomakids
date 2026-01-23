import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  {
    ignores: [
      "**/node_modules/",
      "**/.next/",
      "**/migrations/",
      "**/public/",
      "**/supabase/",
      "scripts/",
      "**/*.sql"
    ]
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    rules: {
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "@next/next/no-img-element": "off",
      "react-hooks/exhaustive-deps": "warn"
    }
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];

export default eslintConfig;
