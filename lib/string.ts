/**
 * Converts various string formats (snake_case, kebab-case, PascalCase, space separated)
 * to camelCase.
 *
 * @example
 * toCamelCase('hello_world') // 'helloWorld'
 * toCamelCase('hello-world') // 'helloWorld'
 * toCamelCase('HelloWorld')  // 'helloWorld'
 * toCamelCase('hello world') // 'helloWorld'
 */
export function toCamelCase(str: string): string {
  if (!str) return '';

  return (
    str
      // Replace underscores, hyphens, and spaces with a special delimiter
      .replace(/[\s_-]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
      // Handle PascalCase conversion
      .replace(/^([A-Z])/, match => match.toLowerCase())
      // Ensure first character is lowercase
      .replace(/^./, match => match.toLowerCase())
  );
}
