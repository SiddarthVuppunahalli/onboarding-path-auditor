import { Stagehand } from "@browserbasehq/stagehand";
import * as dotenv from "dotenv";

dotenv.config();

async function main() {
  const targetUrl = process.argv[2];
  if (!targetUrl) {
    console.error("Usage: npm start <target-url>");
    process.exit(1);
  }

  console.log(`Starting audit for onboarding flow at: ${targetUrl}`);

  // Initialize Stagehand with Browserbase enabled
  // We assume here that API keys are set in the environment.
  const stagehand = new Stagehand({
    env: "BROWSERBASE",
    modelName: "gpt-4o",
  });

  try {
    await stagehand.init();
    console.log("Stagehand initialized.");

    // MVP: just go to the URL and print the title using `page.goto` (part of the normal Playwright page)
    await stagehand.page.goto(targetUrl);
    const title = await stagehand.page.title();
    console.log(`Page title: ${title}`);

    // TODO: implement the flow using fetch, extract, act, observe, agent.

  } catch (err) {
    console.error("Error running audit:", err);
  } finally {
    await stagehand.close();
    console.log("Audit complete. Browser closed.");
  }
}

main().catch(console.error);
