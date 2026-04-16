import { STARTUP_SITES } from "./config/sites";
import { AUDIT_TASKS } from "./tasks/taskDefinitions";
import { runTask } from "./runner/runTask";
import { generateRunId } from "./utils/timestamps";

/**
 * Lightweight hook to test a single path end-to-end.
 */
async function smokeTest() {
  console.log("=== Smoke Testing Path Auditor ===\n");
  
  // Pick an arbitrary target that has a normal HTML structure (Browserbase homepage)
  const targetSite = STARTUP_SITES.find((s) => s.id === "browserbase")!;
  const targetTask = AUDIT_TASKS.find((t) => t.id === "find_entrypoint")!;
  const runId = generateRunId();

  console.log(`Site: ${targetSite.name}`);
  console.log(`Task: ${targetTask.label}`);
  console.log(`Run ID: ${runId}\n`);

  console.log("Executing...");
  const result = await runTask(targetSite, targetTask, runId);

  console.log("\n=== Execution Result ===");
  console.log(JSON.stringify(result, null, 2));
  console.log(`\nRaw output saved to: ./data/raw/${runId}/${targetSite.id}-${targetTask.id}.json`);
}

smokeTest().catch((err) => {
  console.error("Fatal error during smoke test:", err);
});
