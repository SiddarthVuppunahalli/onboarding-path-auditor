import * as dotenv from "dotenv";

/**
 * Loads and parses environment variables.
 * We call dotenv.config() here so simply importing this file guarantees
 * environment variables are initialized before accessing them.
 */
dotenv.config();

/**
 * Safely extract an environment variable, failing fast if missing.
 */
function requireEnvVar(name: string): string {
  const val = process.env[name];
  if (!val || val.trim() === "") {
    console.error(`\x1b[31m[Configuration Error]\x1b[0m Missing required environment variable: \x1b[33m${name}\x1b[0m`);
    console.error(`Please make sure it is defined in your .env file or system environment.`);
    process.exit(1);
  }
  return val;
}

/**
 * The strongly typed, guaranteed-to-exist environment variables for the application.
 */
export const env = {
  // Authentication for Browserbase
  BROWSERBASE_API_KEY: requireEnvVar("BROWSERBASE_API_KEY"),
  BROWSERBASE_PROJECT_ID: requireEnvVar("BROWSERBASE_PROJECT_ID"),
  
  // Authentication for the Stagehand LLM models
  OPENAI_API_KEY: requireEnvVar("OPENAI_API_KEY"),
};
