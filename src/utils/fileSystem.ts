import fs from "fs-extra";
import path from "path";
import { glob } from "glob";

export async function ensureDirectoryExists(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeFile(
  filePath: string,
  content: string,
): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await fs.writeFile(filePath, content, "utf-8");
}

export async function copyDirectory(src: string, dest: string): Promise<void> {
  await fs.copy(src, dest);
}

export async function findFiles(pattern: string): Promise<string[]> {
  return await glob(pattern);
}

export async function createJsonData(
  filePath: string,
  data: any,
): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}
