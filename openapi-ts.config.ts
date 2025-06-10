import { defineConfig } from "@hey-api/openapi-ts"

export default defineConfig({
  input: "https://api.elimika.sarafrika.com/v3/api-docs",
  output: {
    format: "prettier",
    path: "./api-client",
  },
  logs: "./api-client-logs",
  plugins: [
    "zod",
    {
      name: "@hey-api/client-next",
      runtimeConfigPath: "./hey-api-client.config.ts",
    },
    {
      name: "@tanstack/react-query",
      queryOptions: true,
      infiniteQueryOptions: true,
      mutationOptions: true,
    },
    "@hey-api/schemas",
    {
      dates: true,
      name: "@hey-api/transformers",
    },

    {
      enums: "javascript",
      name: "@hey-api/typescript",
    },
    {
      name: "@hey-api/sdk",
      transformer: true,
    },
  ],
})
