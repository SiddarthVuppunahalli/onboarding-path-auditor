import { TaskID } from "./task";

/**
 * Stagehand primitives/layers that might be executed in sequence.
 */
export type PrimitiveType = "fetch" | "extract" | "act" | "observe" | "agent";

/**
 * Common reasons why an extraction or navigation step failed.
 */
export type FailureCategory =
  | "fetch_limit"
  | "js_rendering"
  | "navigation_ambiguity"
  | "wrong_page"
  | "no_structured_data"
  | "timeout"
  | "modal_or_overlay"
  | "site_complexity";

/**
 * Information collected during the execution to track tool usage and decisions.
 */
export interface ExecutionStrategyInfo {
  startedWith: "fetch_first" | "browser_first";
  escalatedToBrowserbase: boolean;
  primitiveSequence: PrimitiveType[];
  usedAgent: boolean;
  usedObserve: boolean;
}

/**
 * Concrete evidence or artifacts tied to the task outcome.
 */
export interface ExecutionEvidence {
  sourceUrl?: string;
  finalUrl?: string;
  evidenceSnippet?: string;
  sessionId?: string;
  sessionUrl?: string;
}

/**
 * Outcome of auditing a specific task on a specific site.
 */
export interface TaskRunResult {
  siteId: string;
  taskId: TaskID;
  status: "pass" | "partial" | "fail";
  startedAt: string; // Storing as ISO string to keep MVP payload easily serializable to JSON
  endedAt: string;
  durationSec: number;
  output: any; // Using `any` or `Record<string, any>` for MVP flexibility when extracting arbitrary structure
  strategy: ExecutionStrategyInfo;
  routingReason?: string;
  evidence: ExecutionEvidence;
  failureCategory?: FailureCategory;
  notes?: string;
}
