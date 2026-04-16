/**
 * Removes characters that are unsafe for filenames.
 * Standardizes the string to a safe, kebab-case-like layout.
 * Example: "Supabase (Auth)" => "supabase-auth"
 */
export function sanitizeFilename(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // Replace non-alphanumeric with hyphen
    .replace(/^-+|-+$/g, "");    // Trim leading/trailing hyphens
}

/**
 * Truncates text to a specified maximum length and appending '...' if cut.
 * Useful for logging evidence snippets without blowing up the terminal.
 */
export function truncateEllipsis(text: string, maxLength: number = 100): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
