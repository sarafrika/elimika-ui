## Generating TypeScript Types

### 1. Generate API Types

Run the OpenAPI TypeScript codegen to generate types from your API definition:

```bash
npx openapi-typescript-codegen --input https://api.elimika.sarafrika.com/v3/api-docs --output api-client --client 'fetch' --useUnionTypes
```

This will create TypeScript interfaces and types in the `api-client` directory based on your API schema.

### 2. Update Global Types with AI Assistance

After generating new API types, use AI to automatically update the `database.types.d.ts` file:

1. **Provide Context to AI**: Share the generated `api-client/index.ts` file with your AI assistant
2. **Request Update**: Ask the AI to compare the current `database.types.d.ts` with the new API types and update it accordingly
3. **AI will**:
   - Identify new types that need to be added
   - Remove any types that no longer exist in the API
   - Maintain backward compatibility aliases
   - Preserve the existing structure and formatting

**Example AI Prompt**:

```
The api-client has been regenerated. Please update the database.types.d.ts file with any new types added or modified. Compare the current database.types.d.ts with the types exported from api-client/index.ts and make the necessary updates.
```

### 3. Manual Type Management (Alternative)

If you prefer manual updates, after generating the types, they are maintained in the `database.types.d.ts` file to make them globally available without requiring imports in your components:

1. The file imports all types from the generated `api-client/index.ts`
2. It declares them as global types using `declare global {}`
3. When new types are generated, manually update this file to include any new types

If you need to add new global types manually:

```typescript
// In database.types.d.ts
import * as ApiTypes from "@/api-client"

declare global {
  // Add new types here
  type NewApiType = ApiTypes.NewApiType
}
```

### 4. Using Global Types

You can use these types directly in your components without importing them:

```tsx
// No import needed!
const studentData: StudentDTO = { ... }
```

### 5. Regenerating Types After API Changes

When the API changes:

1. Re-run the OpenAPI TypeScript codegen command
2. Use AI assistance to update `database.types.d.ts` (recommended) or manually check for new types
3. Test your application to ensure all type references still work correctly
