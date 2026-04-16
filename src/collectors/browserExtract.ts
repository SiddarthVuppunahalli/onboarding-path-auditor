import { Stagehand } from "@browserbasehq/stagehand";
import { runConfig } from "../config/runConfig";
import { PrimitiveType } from "../types/result";

export interface BrowserExtractResult {
  output: any;
  finalUrl: string;
  sessionId?: string;
  sessionUrl?: string;
  primitive: PrimitiveType;
  success: boolean;
  reason?: string;
}

/**
 * Wraps Stagehand's `page.extract()` to pluck structured data directly from the DOM 
 * when the site's rendering defeats simple text `fetch`.
 */
export async function browserExtract(
  url: string,
  instruction: string,
  // Zod schema object if strict typing is needed. Kept optional for MVP unstructured extracts.
  schemaMetadata?: any 
): Promise<BrowserExtractResult> {
  const stagehand = new Stagehand(runConfig.stagehand);
  
  try {
    await stagehand.init();
    await stagehand.page.goto(url);

    // Note: Stagehand and Browserbase SDKs frequently shift how the sessionId is exposed.
    // It's often tucked in the instance properties or logged internally. 
    // We attempt a generic fallback for MVP reporting.
    const sessionId = (stagehand as any).sessionId || undefined;
    const sessionUrl = sessionId ? `https://browserbase.com/sessions/${sessionId}` : undefined;

    const extractArgs: any = { instruction };
    if (schemaMetadata) {
      extractArgs.schema = schemaMetadata;
    }

    // Heavy lifter: ask the LLM driving Stagehand to figure out how to extract the request
    const output = await stagehand.page.extract(extractArgs);

    const finalUrl = stagehand.page.url();

    return {
      output,
      finalUrl,
      sessionId,
      sessionUrl,
      primitive: "extract",
      success: true,
    };
  } catch (error: any) {
    return {
      output: null,
      finalUrl: url, // Best attempt fallback
      primitive: "extract",
      success: false,
      reason: error.message || "Failed Stagehand extraction.",
    };
  } finally {
    // Ensures we don't leak cloud execution time 
    await stagehand.close();
  }
}
