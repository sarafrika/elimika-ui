import { defaultPaginationKeywords, defineConfig } from '@hey-api/openapi-ts';

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error('Environment variable NEXT_PUBLIC_API_URL is not defined.');
}

const normalizedApiBaseUrl = apiBaseUrl.replace(/\/$/, '');

export default defineConfig({
  input: {
    path: `${normalizedApiBaseUrl}/v3/api-docs`,
    headers: {
      accept: 'application/json',
    },
    watch: true,
  },
  output: {
    format: 'prettier',
    lint: 'eslint',
    path: './services/client',
  },
  parser: {
    validate_EXPERIMENTAL: true,
    transforms: {
      enums: 'root',
      readWrite: {
        requests: '{{name}}Writable',
        responses: '{{name}}',
      },
    },
    pagination: {
      keywords: [
        ...defaultPaginationKeywords,
        'pageNumber',
        'pageSize',
        'totalElements',
        'totalPages',
        'hasNext',
        'hasPrevious',
        'first',
        'last',
        'metadata',
        'links',
        'self',
        'previous',
        'next',
      ],
    },
  },
  plugins: [
    '@tanstack/react-query',
    '@hey-api/schemas',
    {
      dates: true,
      name: '@hey-api/transformers',
    },
    {
      enums: 'javascript',
      name: '@hey-api/typescript',
    },
    {
      name: '@hey-api/sdk',
      transformer: true,
    },
    {
      name: 'zod',
      definitions: true,
      metadata: true,
      compatibilityVersion: 3,
    },
    {
      name: '@hey-api/client-next',
      runtimeConfigPath: './hey-api.ts',
    },
  ],
});
