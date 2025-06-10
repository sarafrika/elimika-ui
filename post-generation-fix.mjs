import { readFileSync, writeFileSync } from "fs"

const filePath = "./api-client/@tanstack/react-query.gen.ts"

console.log("🔧 Running post-generation fix for react-query...")

try {
  let content = readFileSync(filePath, "utf8")

  // Fix the query parameter structure
  const originalContent = content
  content = content.replace(
    /"pageable\.page": pageParam,/g,
    "pageable: { page: pageParam },",
  )

  // Count the number of replacements made
  const matches = originalContent.match(/"pageable\.page": pageParam,/g)
  const replacementCount = matches ? matches.length : 0

  writeFileSync(filePath, content)

  console.log(
    `✅ Fixed ${replacementCount} query parameter issues in ${filePath}`,
  )
} catch (error) {
  console.error("❌ Error running post-generation fix:", error)
  process.exit(1)
}
