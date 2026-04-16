/**
 * Represents the normalized output of our quick fetch-first retrieval.
 */
export interface FetchPageResult {
  url: string;
  title?: string;
  textContent?: string;
  rawHtml?: string;
  success: boolean;
  reason?: string;
}

/**
 * Attempts a fast, read-only retrieval of a URL.
 * 
 * Note: If we eventually want to use the dedicated Browserbase fetch infrastructure
 * to handle proxying/CDNs without spinning up a full Stagehand browser instance,
 * we would swap this native `fetch` with an API call to `api.browserbase.com`.
 * For MVP, we use native fetch with a common User-Agent to keep things dependency-free.
 */
export async function fetchPage(url: string): Promise<FetchPageResult> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });

    if (!res.ok) {
      return { url, success: false, reason: `HTTP ${res.status}: ${res.statusText}` };
    }

    const html = await res.text();
    
    // Simplistic MVP parsing using Regex rather than bringing in JsDom or Cheerio.
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : undefined;

    // Very naive body extraction: strip script/style tags, then strip all HTML tags
    const withoutScripts = html.replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, "");
    const textContent = withoutScripts.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    // Soft-fail if we got an empty shell (often happens with heavily hydrated SPAs)
    // which triggers the orchestrator to escalate to browser_first
    if (textContent.length < 50) {
      return { url, success: false, reason: "Insufficient readable text content (possible SPA)." };
    }

    return {
      url,
      title,
      textContent,
      rawHtml: html,
      success: true,
    };
  } catch (error: any) {
    return {
      url,
      success: false,
      reason: error.message || "Unknown fetching error",
    };
  }
}
