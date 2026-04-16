/**
 * Specific IDs for the required onboarding audit tasks.
 */
export type TaskID =
  | "find_entrypoint"
  | "find_quickstart"
  | "extract_install_step"
  | "find_pricing_signup"
  | "find_support_path";

/**
 * Defines a specific onboarding task to audit on a startup's site.
 */
export interface AuditTask {
  id: TaskID;
  label: string;
  description: string;
  preferredStrategy: "fetch_first" | "browser_first";
  successFields: string[];
  maxDurationSec: number;
}
