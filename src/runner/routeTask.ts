import { AuditTask } from "../types/task";
import { PrimitiveType } from "../types/result";

export interface RoutingDecision {
  primitive: PrimitiveType;
  reason: string;
  isEscalation: boolean;
}

/**
 * Determines the absolute cheapest, fastest way to start the task.
 */
export function determineInitialRoute(task: AuditTask): RoutingDecision {
  if (task.preferredStrategy === "fetch_first") {
    return {
      primitive: "fetch",
      reason: "Task allows read-only retrieval via native fetch to save time and compute.",
      isEscalation: false,
    };
  }

  return {
    primitive: "extract",
    reason: "Task specifies browser_first strategy; requires rendered DOM immediately.",
    isEscalation: false,
  };
}

/**
 * Handles the escalation policy when a primitive fails.
 * Routes each audit task through the heaviest workable Browserbase layer 
 * only when the previous lighter layer proved insufficient.
 */
export function determineEscalationRoute(
  task: AuditTask,
  lastPrimitive: PrimitiveType,
  failureContext?: { isJsRendered?: boolean; isMissingContent?: boolean; isAmbiguous?: boolean }
): RoutingDecision {
  // 1. If basic fetch logic failed (due to SPA rendering or heavily obscured text)
  if (lastPrimitive === "fetch") {
    return {
      primitive: "extract",
      reason: "Fetch output was insufficient (missing key content or JS-rendered). Escalating to headless Stagehand extraction.",
      isEscalation: true,
    };
  }

  // 2. If Stagehand `extract` failed (usually meaning the data isn't on the screen and we need to click something)
  if (lastPrimitive === "extract") {
    // If the target is somewhat obvious and standard (e.g. clicking 'Sign up' on a pricing page)
    if (task.id === "find_pricing_signup") {
      return {
        primitive: "act",
        reason: "Extract failed to find data on current page. Next obvious step requires interaction via act().",
        isEscalation: true,
      };
    }

    // If the page is dense with links (e.g. an API reference)
    if (task.id === "find_support_path" || task.id === "find_quickstart") {
      return {
        primitive: "observe",
        reason: "Extract failed and context is dense/ambiguous. Escalating to observe() to map bounding boxes.",
        isEscalation: true,
      };
    }

    // Default fallback from extract is to try and click around
    return {
      primitive: "act",
      reason: "Extract failed. Activating obvious interaction to navigate or reveal hidden state.",
      isEscalation: true,
    };
  }

  // 3. If standard manual routing via act/observe fails, throw the heavy autonomous agent at it
  if (lastPrimitive === "act" || lastPrimitive === "observe") {
    return {
      primitive: "agent",
      reason: "Target remains hidden after act/observe. Semantic context is too messy. Handing full control to agent().",
      isEscalation: true,
    };
  }

  // 4. Terminal escalation loop breaker
  return {
    primitive: "agent",
    reason: "Terminal state. Relying entirely on agent() fallback.",
    isEscalation: true,
  };
}
