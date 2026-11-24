import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";
import pluginReactHooks from "eslint-plugin-react-hooks";
import pluginUnusedImports from "eslint-plugin-unused-imports";

export default [
  {
    files: [
      "src/components/**/*.{js,mjs,cjs,jsx}",
      "src/pages/**/*.{js,mjs,cjs,jsx}",
      "src/design/**/*.{js,jsx}",
      "src/Layout.jsx",
    ],
    ignores: ["src/lib/**/*", "src/components/ui/**/*"],
    ...pluginJs.configs.recommended,
    ...pluginReact.configs.flat.recommended,
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    plugins: {
      react: pluginReact,
      "react-hooks": pluginReactHooks,
      "unused-imports": pluginUnusedImports,
    },
    rules: {
      "no-unused-vars": "off",
      "react/jsx-uses-vars": "error",
      "react/jsx-uses-react": "error",
      "unused-imports/no-unused-imports": "error",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
      "react/prop-types": "off",
      "react/react-in-jsx-scope": "off",
      "react/no-unknown-property": [
        "error",
        { ignore: ["cmdk-input-wrapper", "toast-close"] },
      ],
      "react-hooks/rules-of-hooks": "error",
      // Το spread του recommended χάνεται όταν ορίζουμε δικό μας "rules": ξαναβάζουμε τους κρίσιμους ελέγχους.
      "no-undef": "error",
      "react/jsx-no-undef": "error",
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-self-assign": "error",
    },
  },
  // Λογική, δεδομένα, hooks, API και server: έλεγχος για μεταβλητές/εισαγωγές που λείπουν (σκάνε μόνο την ώρα του παιχνιδιού).
  {
    files: ["src/lib/**/*.js", "src/data/**/*.js", "src/hooks/**/*.js", "src/api/**/*.js", "server/**/*.js", "scripts/**/*.{js,mjs}"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: { ecmaVersion: 2024, sourceType: "module" },
    },
    rules: {
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-self-assign": "error",
    },
  },
];
