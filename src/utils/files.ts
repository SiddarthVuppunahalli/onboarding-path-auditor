import * as fs from "fs";
import * as path from "path";

/**
 * Ensures the given directory path exists, creating parents if necessary.
 */
export function ensureDirExists(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Safely stringifies and writes data to a JSON file.
 * Creates parent directories if they do not exist.
 */
export function writeJsonFile(filePath: string, data: any): void {
  ensureDirExists(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Writes raw text content to a file.
 * Creates parent directories if they do not exist.
 */
export function writeTextFile(filePath: string, text: string): void {
  ensureDirExists(path.dirname(filePath));
  fs.writeFileSync(filePath, text, "utf-8");
}
