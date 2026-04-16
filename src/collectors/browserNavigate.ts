import { Stagehand } from "@browserbasehq/stagehand";
import { runConfig } from "../config/runConfig";
import { PrimitiveType } from "../types/result";

export interface BrowserNavigateResult {
  output: any;
  finalUrl: string;
  sessionId?: string;
  sessionUrl?: string;
  primitive: PrimitiveType;
  success: boolean;
  reason?: string;
}

/**
 * Wraps Stagehand to perform complex page navigation and interaction.
 * Used when a URL entrypoint cannot be easily discovered via regex and requires a simulated user.
 */
export async function browserNavigate(
  startUrl: string,
  navigationGoal: string,
  extractInstruction?: string
): Promise<BrowserNavigateResult> {
  const stagehand = new Stagehand(runConfig.stagehand);
  let assignedPrimitive: PrimitiveType = "act";

  try {
    await stagehand.init();
    await stagehand.page.goto(startUrl);

    // Attempt to pluck the Browserbase Session ID for logging
    const sessionId = (stagehand as any).sessionId || undefined;
    const sessionUrl = sessionId ? `https://browserbase.com/sessions/${sessionId}` : undefined;

    // Use the `act` primitive to navigate naturally (e.g. "Click the 'Sign Up' button on the navbar")
    await stagehand.page.act({
      action: navigationGoal
    });

    let output = null;

    // If we've successfully navigated, and an extraction is part of the task, we can chain it.
    if (extractInstruction) {
      assignedPrimitive = "agent"; // It's technically acting as a mini-agent chaining primitives
      output = await stagehand.page.extract({
        instruction: extractInstruction
      });
    }

    const finalUrl = stagehand.page.url();

    return {
      output,
      finalUrl,
      sessionId,
      sessionUrl,
      primitive: assignedPrimitive,
      success: true,
    };
  } catch (error: any) {
    return {
      output: null,
      finalUrl: startUrl,
      primitive: assignedPrimitive,
      success: false,
      reason: error.message || "Failed Stagehand navigation.",
    };
  } finally {
    await stagehand.close();
  }
}
