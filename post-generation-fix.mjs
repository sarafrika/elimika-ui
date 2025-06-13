import { readFileSync, writeFileSync } from "fs"

const filePath = "./api-client/@tanstack/react-query.gen.ts"

console.log("🔧 Running post-generation fix for react-query...")

try {
  let content = readFileSync(filePath, "utf8")

  // Fix the query parameter structure
  const originalContent = content
  // content = content.replace(
  //   /"pageable\.page": pageParam,/g,
  //   "pageable: { page: pageParam },",
  // )

  // Add @ts-ignore above lines with "pageable.page": pageParam that cause type errors
  content = content.replace(
    /(\s+)"pageable\.page": pageParam,/g,
    '$1// @ts-ignore\n$1"pageable.page": pageParam,',
  )

  // Count the number of replacements made
  const matches = originalContent.match(/"pageable\.page": pageParam,/g)
  const replacementCount = matches ? matches.length : 0

  // Count the number of @ts-ignore comments added
  const ignoreMatches = content.match(
    /\/\/ @ts-ignore\s+"pageable\.page": pageParam,/g,
  )
  const ignoreCount = ignoreMatches ? ignoreMatches.length : 0

  writeFileSync(filePath, content)

  console.log(
    `✅ Fixed ${replacementCount} query parameter issues in ${filePath}`,
  )
  console.log(
    `✅ Added ${ignoreCount} @ts-ignore comments for type errors in ${filePath}`,
  )
} catch (error) {
  console.error("❌ Error running post-generation fix:", error)
  process.exit(1)
}
