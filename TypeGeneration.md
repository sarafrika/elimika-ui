## Generating TypeScript Types

### 1. Generate API Types

Run the OpenAPI TypeScript codegen to generate types from your API definition:

```bash
npx openapi-typescript-codegen --input https://api.elimika.sarafrika.com/v3/api-docs --output api-client --client 'fetch' --useUnionTypes
```

This will create TypeScript interfaces and types in the `api-client` directory based on your API schema.

### 2. Make Types Globally Available

After generating the types, they are maintained in the `database.types.d.ts` file to make them globally available without requiring imports in your components:

1. The file imports all types from the generated `api-client/index.ts`
2. It declares them as global types using `declare global {}`
3. When new types are generated, update this file to include any new types

If you need to add new global types:

```typescript
// In database.types.d.ts
import * as ApiTypes from "@/types"

declare global {
  // Add new types here
  type NewApiType = ApiTypes.NewApiType
}
```

### 3. Using Global Types

You can use these types directly in your components without importing them:

```tsx
// No import needed!
const studentData: StudentDTO = { ... }
```

### 4. Regenerating Types After API Changes

When the API changes:

1. Re-run the OpenAPI TypeScript codegen
2. Check if any new types were added
3. Update `database.types.d.ts` if necessary
