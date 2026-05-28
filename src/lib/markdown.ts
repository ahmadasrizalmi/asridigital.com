import { marked } from 'marked';

// Configure marked for safe HTML output
marked.setOptions({
  breaks: true, // Convert \n to <br>
  gfm: true,   // GitHub Flavored Markdown
});

/**
 * Convert markdown string to HTML
 * Used for product descriptions, blog content, etc.
 */
export function markdownToHtml(md: string | null | undefined): string {
  if (!md) return '';
  try {
    return marked.parse(md) as string;
  } catch {
    return md;
  }
}
