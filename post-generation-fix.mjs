import { readFileSync, writeFileSync } from "node:fs"

const filePath = "./api-client/@tanstack/react-query.gen.ts"

try {
  let content = readFileSync(filePath, "utf8")

  // Fix the query parameter structure
  const originalContent = content
  // content = content.replace(
  //   /"pageable\.page": pageParam,/g,
  //   "pageable: { page: pageParam },",
  // )

  // Add @ts-expect-error above lines with "pageable.page": pageParam that cause type errors
  content = content.replace(
    /(\s+)"pageable\.page": pageParam,/g,
    '$1// @ts-ignore\n$1"pageable.page": pageParam,',
  )

  // Count the number of replacements made
  const matches = originalContent.match(/"pageable\.page": pageParam,/g)
  const _replacementCount = matches ? matches.length : 0

  // Count the number of @ts-expect-error comments added
  const ignoreMatches = content.match(
    /\/\/ @ts-ignore\s+"pageable\.page": pageParam,/g,
  )
  const _ignoreCount = ignoreMatches ? ignoreMatches.length : 0

  writeFileSync(filePath, content)
} catch (_error) {
  process.exit(1)
}
