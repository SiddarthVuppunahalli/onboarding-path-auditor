import { env } from "./env";

/**
 * Main application settings used across runners.
 * Centralizing this ensures we aren't passing raw `env` constants everywhere
 * and allows for easy updates to execution defaults.
 */
export const runConfig = {
  // Configuration fed directly to new Stagehand() instances
  stagehand: {
    env: "BROWSERBASE" as const,
    modelName: "gpt-4o" as const, // Pre-selected as the ideal MVP model to keep things simple
    logger: () => {},    // Null logger to keep our CLI output clean
  },
  
  // Base paths for our resulting reports 
  paths: {
    rawBaseDir: "./data/raw",
    scoredBaseDir: "./data/scored",
    reportsBaseDir: "./data/reports",
  }
};
