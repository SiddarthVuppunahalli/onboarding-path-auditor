/**
 * Defines a devtools startup's site to be audited.
 */
export interface AuditSite {
  id: string;
  name: string;
  homepageUrl: string;
  docsRootUrl: string;
  notes?: string;
}

/**
 * Defines routing mechanisms and decisions for the path auditor.
 * Useful for keeping track of how a task execution request is routed or escalated.
 */
export interface TaskRouting {
  taskId: string;
  assignedStrategy: "fetch_first" | "browser_first";
  reason: string;
}
