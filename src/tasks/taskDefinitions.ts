import { AuditTask } from "../types/task";

/**
 * The 5 core onboarding path audit tasks.
 * For MVP, we prefer the 'fetch_first' strategy which attempts
 * a fast static extraction before escalating to a full browser execution.
 */
export const AUDIT_TASKS: AuditTask[] = [
  {
    id: "find_entrypoint",
    label: "Find Entrypoint",
    description: "Identify how a new user signs up or logs into the platform from the homepage.",
    preferredStrategy: "fetch_first",
    successFields: ["signupUrl", "loginUrl"],
    maxDurationSec: 30,
  },
  {
    id: "find_quickstart",
    label: "Find Quickstart",
    description: "Locate the primary quickstart or getting started guide from the docs root.",
    preferredStrategy: "fetch_first",
    successFields: ["quickstartUrl"],
    maxDurationSec: 30,
  },
  {
    id: "extract_install_step",
    label: "Extract Install Step",
    description: "Extract the very first CLI/NPM command required to install or use the tool.",
    preferredStrategy: "fetch_first",
    successFields: ["installCommand"],
    maxDurationSec: 60,
  },
  {
    id: "find_pricing_signup",
    label: "Find Pricing Sign-up",
    description: "Find the call-to-action link on the pricing page for the lowest paid tier.",
    preferredStrategy: "fetch_first",
    successFields: ["pricingPlanUrl"],
    maxDurationSec: 45,
  },
  {
    id: "find_support_path",
    label: "Find Support Path",
    description: "Locate the route a frustrated developer would take to reach a human or ticket system.",
    preferredStrategy: "fetch_first",
    successFields: ["supportUrl"],
    maxDurationSec: 45,
  },
];
