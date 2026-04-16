import { AuditSite } from "../types/routing";
import { AuditTask } from "../types/task";
import { TaskRunResult, ExecutionStrategyInfo, ExecutionEvidence } from "../types/result";
import { determineInitialRoute, determineEscalationRoute } from "./routeTask";
import { discoverEntrypoints } from "../collectors/discoverEntrypoints";
import { browserExtract } from "../collectors/browserExtract";
import { getIsoTimestamp, calculateDurationSec } from "../utils/timestamps";
import { writeJsonFile } from "../utils/files";
import { sanitizeFilename } from "../utils/strings";
import { runConfig } from "../config/runConfig";

/**
 * The core execution loop for a specific task against a specific site.
 */
export async function runTask(
  site: AuditSite,
  task: AuditTask,
  runId: string
): Promise<TaskRunResult> {
  const startMs = Date.now();
  const startedAt = getIsoTimestamp();

  // Baseline tracking structures
  const strategyInfo: ExecutionStrategyInfo = {
    startedWith: task.preferredStrategy,
    escalatedToBrowserbase: false,
    primitiveSequence: [],
    usedAgent: false,
    usedObserve: false,
  };

  let executionOutput: any = null;
  let status: TaskRunResult["status"] = "fail";
  let failureCategory: TaskRunResult["failureCategory"] = undefined;
  const evidence: ExecutionEvidence = { sourceUrl: site.homepageUrl };

  // 1. Ask the router what we are allowed to start with
  const initialRoute = determineInitialRoute(task);
  strategyInfo.primitiveSequence.push(initialRoute.primitive);

  // ============================================
  // TASK ROUTER LOGIC
  // ============================================
  if (task.id === "find_entrypoint") {

    // --- STEP 1: Attempt Fetch-First ---
    if (initialRoute.primitive === "fetch") {
      const candidates = await discoverEntrypoints(site.homepageUrl);
      const signups = candidates.filter((c) => c.matchType === "signup");

      if (signups.length > 0) {
        // We found something statically! We saved a lot of time.
        executionOutput = { signupUrl: signups[0].url };
        status = "pass";
      } else {
        // --- STEP 2: Escalate to Browser/Stagehand ---
        strategyInfo.escalatedToBrowserbase = true;
        const escalation = determineEscalationRoute(task, "fetch", { isMissingContent: true });
        strategyInfo.primitiveSequence.push(escalation.primitive);

        if (escalation.primitive === "extract") {
          console.log(`[${site.name}] Escalating to Browser Extraction...`);
          const extractRes = await browserExtract(
            site.homepageUrl,
            "Extract the exact URLs that a user would click to create a new account (signupUrl) or log in (loginUrl)."
          );

          evidence.finalUrl = extractRes.finalUrl;
          if (extractRes.sessionId) {
            evidence.sessionId = extractRes.sessionId;
            evidence.sessionUrl = extractRes.sessionUrl;
          }

          if (extractRes.success && extractRes.output) {
            executionOutput = extractRes.output;
            status = "pass";
          } else {
            failureCategory = "navigation_ambiguity";
          }
        }
      }
    }
  } else if (task.id === "find_quickstart") {
    // --- STEP 1: Attempt Fetch-First ---
    if (initialRoute.primitive === "fetch") {
      const candidates = await discoverEntrypoints(site.docsRootUrl || site.homepageUrl);
      const quickstarts = candidates.filter((c) => c.matchType === "quickstart" || c.matchType === "docs");

      if (quickstarts.length > 0) {
        executionOutput = { 
          quickstartUrl: quickstarts[0].url,
          quickstartTitle: quickstarts[0].label,
          pathTaken: "fetch -> heuristic match",
          confidence: "high"
        };
        status = "pass";
      } else {
        // --- STEP 2: Escalate ---
        strategyInfo.escalatedToBrowserbase = true;
        const escalation = determineEscalationRoute(task, "fetch", { isMissingContent: true });
        strategyInfo.primitiveSequence.push(escalation.primitive);

        if (escalation.primitive === "extract") {
          console.log(`[${site.name}] Escalating to Browser Extraction for Quickstart...`);
          const extractRes = await browserExtract(
            site.docsRootUrl || site.homepageUrl,
            "Find the most prominent link to the 'Quickstart' or 'Getting Started' guide. Return '{ quickstartUrl, quickstartTitle }'"
          );

          evidence.finalUrl = extractRes.finalUrl;
          if (extractRes.sessionId) {
            evidence.sessionId = extractRes.sessionId;
            evidence.sessionUrl = extractRes.sessionUrl;
          }

          if (extractRes.success && extractRes.output) {
            executionOutput = {
              quickstartUrl: extractRes.output.quickstartUrl || extractRes.output.url,
              quickstartTitle: extractRes.output.quickstartTitle || extractRes.output.title || "Quickstart",
              pathTaken: "browser_extract",
              confidence: "medium"
            };
            status = "pass";
          } else {
            failureCategory = "navigation_ambiguity";
          }
        }
      }
    }
  } else if (task.id === "extract_install_step") {
    if (initialRoute.primitive === "fetch") {
      // Heuristic: Accurately parsing raw HTML blobs for an install CLI command via RegExp 
      // is highly brittle compared to Stagehand. We aggressively escalate this task to the browser.
      strategyInfo.escalatedToBrowserbase = true;
      const escalation = determineEscalationRoute(task, "fetch", { isMissingContent: true });
      strategyInfo.primitiveSequence.push(escalation.primitive);

      console.log(`[${site.name}] Task 'extract_install_step' auto-escalates to Stagehand extraction for DOM reasoning...`);
      const extractRes = await browserExtract(
        site.docsRootUrl || site.homepageUrl,
        "Extract the very first CLI command meant to install the tool or SDK (e.g. npm install, pip install). Return '{ installCommand, packageName, sdkLanguage, evidenceSnippet }'."
      );
      
      evidence.finalUrl = extractRes.finalUrl;
      if (extractRes.sessionId) {
        evidence.sessionId = extractRes.sessionId;
        evidence.sessionUrl = extractRes.sessionUrl;
      }

      if (extractRes.success && extractRes.output) {
        executionOutput = {
          installCommand: extractRes.output.installCommand || extractRes.output.command || null,
          packageName: extractRes.output.packageName || null,
          sdkLanguage: extractRes.output.sdkLanguage || extractRes.output.language || null,
          evidenceSnippet: extractRes.output.evidenceSnippet || null
        };
        status = "pass";
      } else {
        failureCategory = "no_structured_data";
      }
    }
  } else if (task.id === "find_pricing_signup") {
    if (initialRoute.primitive === "fetch") {
      const candidates = await discoverEntrypoints(site.homepageUrl);
      const pricingLinks = candidates.filter((c) => c.matchType === "pricing");

      if (pricingLinks.length > 0) {
        // We found the pricing page link via fast heuristic, but to find the lowest paid 
        // tier CTA link we must aggressively escalate to rendering that page.
        strategyInfo.escalatedToBrowserbase = true;
        const escalation = determineEscalationRoute(task, "fetch", { isMissingContent: true });
        strategyInfo.primitiveSequence.push(escalation.primitive);

        console.log(`[${site.name}] Found static pricing URL. Escalating to Browser to extract specific tier CTA...`);
        const extractRes = await browserExtract(
          pricingLinks[0].url,
          "Look at the pricing tiers. Extract the call-to-action button for the lowest paid tier (or free tier). Return '{ signupUrl, ctaLabel, requiresBrowserInteraction (boolean, true if it pops open a modal/stripe page) }'."
        );

        evidence.finalUrl = extractRes.finalUrl;
        if (extractRes.sessionId) {
          evidence.sessionId = extractRes.sessionId;
          evidence.sessionUrl = extractRes.sessionUrl;
        }

        if (extractRes.success && extractRes.output) {
          executionOutput = {
            pricingUrl: pricingLinks[0].url,
            signupUrl: extractRes.output.signupUrl || extractRes.output.url || null,
            ctaLabel: extractRes.output.ctaLabel || extractRes.output.label || null,
            requiresBrowserInteraction: extractRes.output.requiresBrowserInteraction === true
          };
          status = "pass";
        } else {
          failureCategory = "js_rendering";
        }
      } else {
        failureCategory = "navigation_ambiguity";
        executionOutput = { note: "Failed to statically route to pricing page off homepage." };
      }
    }
  } else if (task.id === "find_support_path") {
    if (initialRoute.primitive === "fetch") {
      const candidates = await discoverEntrypoints(site.docsRootUrl || site.homepageUrl);
      const supportLinks = candidates.filter((c) => c.matchType === "support");

      if (supportLinks.length > 0) {
        // Fetched successfully via static heuristics
        executionOutput = {
          supportUrl: supportLinks[0].url,
          supportType: "static_link",
          supportLabel: supportLinks[0].label
        };
        status = "pass";
      } else {
        // Escalate to browser rendering to track down a hidden Intercom/Zendesk widget or deep link
        strategyInfo.escalatedToBrowserbase = true;
        const escalation = determineEscalationRoute(task, "fetch", { isAmbiguous: true });
        strategyInfo.primitiveSequence.push(escalation.primitive);

        console.log(`[${site.name}] No static support link found. Escalating to Browser Extractor to check for widgets/menus...`);
        const extractRes = await browserExtract(
          site.docsRootUrl || site.homepageUrl,
          "Find the most likely support vector for developers (e.g., Discord link, Slack community, Intercom bubble, help email). Return '{ supportUrl, supportType, supportLabel }'."
        );

        evidence.finalUrl = extractRes.finalUrl;
        if (extractRes.sessionId) {
          evidence.sessionId = extractRes.sessionId;
          evidence.sessionUrl = extractRes.sessionUrl;
        }

        if (extractRes.success && extractRes.output) {
          executionOutput = {
            supportUrl: extractRes.output.supportUrl || extractRes.output.url || null,
            supportType: extractRes.output.supportType || "extracted",
            supportLabel: extractRes.output.supportLabel || extractRes.output.label || null
          };
          status = "pass";
        } else {
          failureCategory = "modal_or_overlay";
        }
      }
    }
  } else {
    // Safety fallback for un-implemented tasks
    executionOutput = { note: `Task '${task.id}' driver not yet implemented.` };
    failureCategory = "site_complexity";
  }

  // ============================================
  // RESULT COMPILATION
  // ============================================
  if (strategyInfo.primitiveSequence.includes("agent")) strategyInfo.usedAgent = true;
  if (strategyInfo.primitiveSequence.includes("observe")) strategyInfo.usedObserve = true;

  const result: TaskRunResult = {
    siteId: site.id,
    taskId: task.id,
    status,
    startedAt,
    endedAt: getIsoTimestamp(),
    durationSec: calculateDurationSec(startMs, Date.now()),
    output: executionOutput,
    strategy: strategyInfo,
    evidence,
    failureCategory,
  };

  // Persist raw dump
  const safeSite = sanitizeFilename(site.name);
  const outputPath = `${runConfig.paths.rawBaseDir}/${runId}/${safeSite}-${task.id}.json`;
  writeJsonFile(outputPath, result);

  return result;
}
