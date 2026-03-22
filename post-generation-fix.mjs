import { readFileSync, writeFileSync } from 'node:fs';

const reactQueryFilePath = './services/client/@tanstack/react-query.gen.ts';
const zodFilePath = './services/client/zod.gen.ts';

const replaceOrThrow = (content, searchValue, replaceValue, label) => {
  if (content.includes(replaceValue)) {
    return content;
  }

  if (!content.includes(searchValue)) {
    throw new Error(`Unable to find ${label}`);
  }

  return content.replace(searchValue, replaceValue);
};

const fixReactQueryGeneration = content => {
  let nextContent = content.replaceAll(/^(\s*)\/\/ @ts-ignore\n/gm, '');

  if (!nextContent.startsWith('// @ts-nocheck\n')) {
    nextContent = `// @ts-nocheck\n${nextContent}`;
  }

  nextContent = nextContent.replaceAll(
    "'pageable.page': pageParam,",
    'pageable: { page: pageParam },'
  );

  nextContent = replaceOrThrow(
    nextContent,
    `  if (page.query) {
    params.query = {
      ...(queryKey[0].query as any),
      ...(page.query as any),
    };
  }
`,
    `  if (page.query) {
    const baseQuery = (queryKey[0].query as any) ?? {};
    const nextQuery = (page.query as any) ?? {};
    const basePageable = baseQuery.pageable ?? {};
    const nextPageable = nextQuery.pageable ?? {};

    params.query = {
      ...baseQuery,
      ...nextQuery,
      ...(Object.keys(basePageable).length > 0 || Object.keys(nextPageable).length > 0
        ? {
            pageable: {
              ...basePageable,
              ...nextPageable,
            },
          }
        : {}),
    };
  }
`,
    'createInfiniteParams query merge block'
  );

  return nextContent;
};

const fixZodGeneration = content =>
  content
    .replaceAll(".default('0')", '.default(0)')
    .replaceAll(".default('2')", '.default(2)')
    .replaceAll(".default('true')", '.default(true)')
    .replaceAll(".default('false')", '.default(false)');

const updateFile = (filePath, transform) => {
  const currentContent = readFileSync(filePath, 'utf8');
  const nextContent = transform(currentContent);

  if (nextContent !== currentContent) {
    writeFileSync(filePath, nextContent);
  }
};

updateFile(reactQueryFilePath, fixReactQueryGeneration);
updateFile(zodFilePath, fixZodGeneration);
