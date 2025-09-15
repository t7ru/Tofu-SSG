import fs from "fs-extra";
import path from "path";
import { createRequire } from "module";
import { marked } from "marked";
import { ArticleMetadata, GeneratedContent } from "../types/index.js";

const require = createRequire(import.meta.url);
const frontMatter = require("front-matter");

interface FrontMatterResult {
  attributes: ArticleMetadata;
  body: string;
}

export async function parseMarkdownFile(
  filePath: string,
): Promise<GeneratedContent> {
  const fileContent = await fs.readFile(filePath, "utf-8");
  const { attributes, body } = frontMatter(fileContent) as FrontMatterResult;

  const htmlContent = marked(body);
  const slug = path.basename(filePath, path.extname(filePath));

  const excerpt =
    attributes.excerpt ||
    body
      .split("\n\n")[0]
      .replace(/^#+\s*/, "")
      .substring(0, 150) + "...";

  const rawCategories = attributes.categories || [];
  const categories = Array.isArray(rawCategories)
    ? [...new Set(rawCategories)]
    : [];

  function slugify(value: string) {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  const categoriesData = categories.map(c => ({ name: c, slug: slugify(c) }));

  let tag: string | undefined;
  if (typeof attributes.tags === "string") {
    tag = attributes.tags.trim();
  } else if (Array.isArray(attributes.tags) && attributes.tags.length) {
    tag = String(attributes.tags[0]).trim();
  } else if (typeof attributes.tag === "string") {
    tag = attributes.tag.trim();
  }

  if (!tag || !tag.length) {
    tag = "News";
  }

  let tagLink = "";
  switch (tag.toLowerCase()) {
    case "news":
      tagLink = "/news";
      break;
    case "guide":
    case "guides":
      tagLink = "/guides";
      break;
    default:
      tagLink = `/tags/${slugify(tag)}`;
      break;
  }

  const metadata: ArticleMetadata = {
    ...attributes,
    title: attributes.title || "Untitled",
    description: attributes.description || excerpt,
    date: attributes.date || new Date().toISOString(),
    author: attributes.author || "Anonymous",
    categories,
    categoriesData,
    tag,
    tagLink,
    excerpt,
    slug,
    featured: !!attributes.featured,
  };

  return {
    metadata,
    content: htmlContent,
  };
}

export async function parseAllArticles(
  articlesDir: string,
): Promise<GeneratedContent[]> {
  const files = await fs.readdir(articlesDir);
  const markdownFiles = files.filter(
    (file) => path.extname(file).toLowerCase() === ".md",
  );

  const articles: GeneratedContent[] = [];

  for (const file of markdownFiles) {
    const filePath = path.join(articlesDir, file);
    const article = await parseMarkdownFile(filePath);
    articles.push(article);
  }

  return articles.sort(
    (a: GeneratedContent, b: GeneratedContent) =>
      new Date(b.metadata.date).getTime() - new Date(a.metadata.date).getTime(),
  );
}
