import fs from "fs-extra";
import path from "path";
import { AuthorMetadata } from "../types/index.js";

export async function loadAuthorMetadata(
  authorId: string,
  authorsDir: string,
): Promise<AuthorMetadata> {
  const authorFile = path.join(authorsDir, `${authorId}.json`);

  try {
    return await fs.readJson(authorFile);
  } catch (error) {
    console.warn(`Author metadata not found for ${authorId}. Using default.`);
    return {
      name: authorId,
      bio: "",
      links: {},
    };
  }
}

export async function loadAllAuthors(
  authorsDir: string,
): Promise<Record<string, AuthorMetadata>> {
  const files = await fs.readdir(authorsDir);
  const jsonFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === ".json",
  );

  const authors: Record<string, AuthorMetadata> = {};

  for (const file of jsonFiles) {
    const authorId = path.basename(file, ".json");
    authors[authorId] = await loadAuthorMetadata(authorId, authorsDir);
  }

  return authors;
}
