import { fetchPage } from "./fetchPage";

export interface CandidateLink {
  label: string;
  url: string;
  matchType: "docs" | "quickstart" | "pricing" | "signup" | "support" | "unknown";
  sourceUrl: string;
}

/**
 * Heuristic mapping to classify links based on their text or href.
 */
const CATEGORY_HEURISTICS: Record<string, RegExp> = {
  docs: /(docs|documentation|developers|api)/i,
  quickstart: /(quickstart|get(\s*)?ting\s*started|tutorial|guide)/i,
  pricing: /(pricing|plans|upgrade)/i,
  signup: /(sign\s*up|register|get\s*started\s*for\s*free|create\s*account)/i,
  support: /(support|contact|help|discord|slack|community|status)/i,
};

/**
 * Given a URL, aggressively plucks out URLs that might satisfy our path auditing targets.
 */
export async function discoverEntrypoints(sourceUrl: string): Promise<CandidateLink[]> {
  const page = await fetchPage(sourceUrl);
  if (!page.success || !page.rawHtml) {
    return [];
  }

  // Naive MVP extraction: match <a href="...">...</a>
  const aTagRegex = /<a\s+(?:[^>]*?\s+)?href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const candidates: CandidateLink[] = [];

  let match;
  while ((match = aTagRegex.exec(page.rawHtml)) !== null) {
    const rawHref = match[1];
    const anchorText = match[2].replace(/<[^>]+>/g, "").trim(); // Strip nested HTML tags inside <a>

    // Resolve relative URLs to absolute
    let absoluteUrl: string;
    try {
      absoluteUrl = new URL(rawHref, sourceUrl).toString();
    } catch {
      continue; // Skip javascript:void(0) and malformed URLs
    }

    // Heuristically classify the link based on both the anchor text and the href path
    let matchType: CandidateLink["matchType"] = "unknown";
    const scoringString = `${anchorText} ${rawHref}`;

    for (const [category, regex] of Object.entries(CATEGORY_HEURISTICS)) {
      if (regex.test(scoringString)) {
        matchType = category as CandidateLink["matchType"];
        break; // Grab the first heuristic hit
      }
    }

    if (matchType !== "unknown") {
      candidates.push({
        label: anchorText || "[No Text]",
        url: absoluteUrl,
        matchType,
        sourceUrl,
      });
    }
  }

  // Deduplicate by URL
  const uniqueUrls = new Set<string>();
  return candidates.filter(c => {
    if (uniqueUrls.has(c.url)) return false;
    uniqueUrls.add(c.url);
    return true;
  });
}
