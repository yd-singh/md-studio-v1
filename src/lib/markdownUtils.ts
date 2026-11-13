export interface HeadingItem {
  id: string;
  text: string;
  level: number;
}

export interface MarkdownMetrics {
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
  headingCount: number;
}

/**
 * Generate a clean, URL-safe slug for heading anchors
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

/**
 * Extract text content from React children or markdown text
 */
export function extractText(node: any): string {
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (!node) return '';
  if (Array.isArray(node)) {
    return node.map(extractText).join('');
  }
  if (typeof node === 'object' && node.props && node.props.children) {
    return extractText(node.props.children);
  }
  return '';
}

/**
 * Parse all Markdown headings (# to ####) into structured items for the TOC
 */
export function parseHeadings(markdown: string): HeadingItem[] {
  if (!markdown) return [];
  
  const headingRegex = /^(#{1,4})\s+(.+)$/gm;
  const headings: HeadingItem[] = [];
  const usedSlugs = new Map<string, number>();

  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(markdown)) !== null) {
    const hashes = match[1];
    const rawText = match[2].trim();
    // Remove markdown links like [text](url) -> text, inline code `code` -> code, formatting **bold** -> bold
    const cleanText = rawText
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[`*_~]/g, '')
      .trim();

    if (!cleanText) continue;

    let baseSlug = slugify(cleanText);
    if (!baseSlug) baseSlug = `section-${headings.length + 1}`;

    let slug = baseSlug;
    const count = usedSlugs.get(baseSlug) || 0;
    if (count > 0) {
      slug = `${baseSlug}-${count}`;
    }
    usedSlugs.set(baseSlug, count + 1);

    headings.push({
      id: slug,
      text: cleanText,
      level: hashes.length,
    });
  }

  return headings;
}

/**
 * Calculate accurate reading time and word count from markdown source
 */
export function calculateMetrics(markdown: string): MarkdownMetrics {
  if (!markdown || !markdown.trim()) {
    return { wordCount: 0, charCount: 0, readingTimeMinutes: 0, headingCount: 0 };
  }

  // Strip code blocks to avoid inflating word count with code syntax
  const noCodeBlocks = markdown
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`]*`/g, '');

  // Strip images and links
  const textOnly = noCodeBlocks
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[(.*?)\]\(.*?\)/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/[#*`_~>-]/g, ' ')
    .trim();

  // Words count
  const words = textOnly.match(/[\w\d'-]+/gu);
  const wordCount = words ? words.length : 0;
  const charCount = markdown.length;

  // Average reading speed: 200 words per minute
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  // Count headings
  const headings = parseHeadings(markdown);

  return {
    wordCount,
    charCount,
    readingTimeMinutes,
    headingCount: headings.length,
  };
}
