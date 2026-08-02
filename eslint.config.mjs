import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

/** @type {import("eslint").Linter.Config[]} */
const config = [
  {
    ignores: [".next/**", "node_modules/**", "coverage/**", "next-env.d.ts", ".data/**"],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      /*
       * The avatar is a small local file rendered once, above the fold, at a
       * fixed size. `next/image` would ship client-side JavaScript and a runtime
       * optimiser to a page that otherwise has neither, so Linkfile uses a plain
       * <img> with explicit width and height instead.
       */
      "@next/next/no-img-element": "off",

      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrors: "none" },
      ],
    },
  },
];

export default config;
