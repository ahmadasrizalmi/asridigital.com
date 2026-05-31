/**
 * Optimize Cloudinary image URL by adding width/height/crop transforms.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeImage(url: string, options: { w?: number; h?: number; c?: string } = {}): string {
  if (!url) return url;
  if (!url.includes('res.cloudinary.com')) return url;
  
  // Don't double-transform
  if (url.includes('/upload/w_') || url.includes('/upload/c_')) return url;
  
  const { w, h, c = 'fill' } = options;
  const transforms: string[] = [];
  if (w) transforms.push(`w_${w}`);
  if (h) transforms.push(`h_${h}`);
  if (w || h) transforms.push(`c_${c}`);
  
  if (transforms.length === 0) return url;
  
  return url.replace('/upload/', `/upload/${transforms.join(',')}/`);
}

export function formatIDR(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function parseTags(tags: string | string[]): string[] {
  if (Array.isArray(tags)) return tags;
  try {
    return JSON.parse(tags);
  } catch {
    return [];
  }
}

/**
 * Convert plain-text product description to formatted HTML.
 * Handles: paragraphs (double newline), bullet lists (- item),
 * bold (**text**), line breaks, and blockquotes (> text).
 */
export function formatDescription(text: string): string {
  if (!text) return '';

  // Split into paragraphs by double newline (on raw text, before escaping)
  const paragraphs = text.split(/\n{2,}/);
  const htmlParts: string[] = [];

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');

    // Check if this paragraph is a list (all non-empty lines start with "- ")
    const nonEmpty = lines.filter(l => l.trim());
    const listLines = nonEmpty.filter(l => l.trim().startsWith('- '));
    if (listLines.length > 0 && listLines.length === nonEmpty.length) {
      const items = lines
        .map(l => l.trim().replace(/^- /, ''))
        .filter(Boolean)
        .map(item => `  <li>${escapeAndFormat(item)}</li>`)
        .join('\n');
      htmlParts.push(`<ul class="list-disc pl-5 space-y-1 my-3">\n${items}\n</ul>`);
      continue;
    }

    // Check if this paragraph is a blockquote (all lines start with "> ")
    const quoteLines = nonEmpty.filter(l => l.trim().startsWith('> '));
    if (quoteLines.length > 0 && quoteLines.length === nonEmpty.length) {
      const content = lines
        .map(l => l.trim().replace(/^> /, ''))
        .filter(Boolean)
        .map(l => escapeAndFormat(l))
        .join('<br>');
      htmlParts.push(`<blockquote class="border-l-4 border-primary/30 pl-4 py-2 my-3 text-text-muted italic">${content}</blockquote>`);
      continue;
    }

    // Regular paragraph — join lines with <br> for single newlines
    const content = lines.map(l => escapeAndFormat(l.trim())).filter(Boolean).join('<br>');
    htmlParts.push(`<p class="my-3">${content}</p>`);
  }

  return htmlParts.join('\n');
}

/** Escape HTML then apply inline formatting: **bold**, *italic*, `code` */
function escapeAndFormat(text: string): string {
  const safe = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return safe
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-background px-1.5 py-0.5 rounded text-sm">$1</code>');
}

export function timeAgo(date: Date): string {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return 'Baru saja';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} menit yang lalu`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} jam yang lalu`;
  return date.toLocaleDateString('id-ID');
}
