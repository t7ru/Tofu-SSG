import fs from "fs-extra";
import path from "path";
import { parseAllArticles } from "./parsers/markdownParser.js";
import { loadAllAuthors } from "./parsers/metadataParser.js";
import { TemplateEngine } from "./utils/templateEngine.js";
import { ArticleGenerator } from "./generators/articleGenerator.js";
import { AuthorGenerator } from "./generators/authorGenerator.js";
import { IndexGenerator } from "./generators/indexGenerator.js";
import { PageGenerator } from "./generators/pageGenerator.js";
import {
  ensureDirectoryExists,
  copyDirectory,
  createJsonData,
} from "./utils/fileSystem.js";
import { SiteMetadata } from "./types/index.js";

// Configs
const rootDir = process.cwd();
const contentDir = path.join(rootDir, "content");
const articlesDir = path.join(contentDir, "articles");
const authorsDir = path.join(contentDir, "authors");
// const assetsDir = path.join(contentDir, "assets");
const templatesDir = path.join(rootDir, "templates");
// const outputDir = path.join(rootDir, "output");

async function main() {
  const siteMetadata: SiteMetadata = {
    title: "Tofu's SSG",
    description: "Static site generator from markdown files for a blog.",
    baseUrl: "https://example.com",
  };

  try {
    await ensureDirectoryExists(articlesDir);
    await ensureDirectoryExists(authorsDir);

    console.log("Parsing articles...");
    const articles = await parseAllArticles(articlesDir);
    console.log(`Found ${articles.length} articles`);

    console.log("Loading authors...");
    const authors = await loadAllAuthors(authorsDir);
    console.log(`Found ${Object.keys(authors).length} authors`);

    const templateEngine = new TemplateEngine(templatesDir);
    const articleGenerator = new ArticleGenerator(templateEngine);
    const authorGenerator = new AuthorGenerator(templateEngine);
    const indexGenerator = new IndexGenerator(templateEngine);
    const pageGenerator = new PageGenerator(templateEngine);

    await fs.remove("./dist");
    await ensureDirectoryExists("./dist");
    await ensureDirectoryExists("./dist/articles");
    await ensureDirectoryExists("./dist/authors");
    await ensureDirectoryExists("./dist/news");
    await ensureDirectoryExists("./dist/guides");
    await ensureDirectoryExists("./dist/games");
    await ensureDirectoryExists("./dist/about");
    await ensureDirectoryExists("./dist/categories");

    console.log("Generating homepage...");
    const articlesMetadata = articles.map((article) => article.metadata);
    console.log("Articles metadata for homepage:", articlesMetadata);

    try {
      await indexGenerator.generate(articlesMetadata, siteMetadata, authors);
      console.log("Homepage generated successfully");
    } catch (error) {
      console.error("Error generating homepage:", error);
      throw error;
    }

    console.log("Generating articles...");
    for (const article of articles) {
      try {
        await articleGenerator.generate(article, siteMetadata, authors);
        console.log(`Generated article: ${article.metadata.slug}`);
      } catch (error) {
        console.error(
          `Error generating article ${article.metadata.slug}:`,
          error,
        );
      }
    }

    console.log("Generating author pages...");
    for (const [authorId, authorData] of Object.entries(authors)) {
      const authorArticles = articles.filter(
        (article) => article.metadata.author === authorId,
      );
      try {
        await authorGenerator.generate(
          authorId,
          authorData,
          authorArticles,
          siteMetadata,
        );
        console.log(`Generated author page: ${authorId}`);
      } catch (error) {
        console.error(`Error generating author page ${authorId}:`, error);
      }
    }

    console.log("Generating static pages...");
    await pageGenerator.generateNewsPage(articlesMetadata, siteMetadata);
    await pageGenerator.generateGuidesPage(articlesMetadata, siteMetadata);
    await pageGenerator.generateGamesPage(siteMetadata);
    await pageGenerator.generateAboutPage(siteMetadata, authors);
    await pageGenerator.generateCategoryPages(articlesMetadata, siteMetadata);
    console.log("Static pages generated");

    console.log("Copying static assets...");
    try {
      await copyDirectory("./static", "./dist");
      console.log("Static assets copied");
    } catch (error) {
      console.log("No static directory found, skipping...");
    }

    console.log("Creating JSON data...");
    await createJsonData("./dist/data.json", {
      articles: articlesMetadata,
      authors,
      site: siteMetadata,
    });

    const indexExists = await fs.pathExists("./dist/index.html");
    console.log("Index.html exists:", indexExists);

    if (indexExists) {
      const indexContent = await fs.readFile("./dist/index.html", "utf-8");
      console.log("Index.html content length:", indexContent.length);
      console.log(
        "Index.html preview:",
        indexContent.substring(0, 200) + "...",
      );
    }

    console.log("Site generation complete!");
    console.log("Generated files:");
    console.log("- Homepage: ./dist/index.html");
    console.log(`- ${articles.length} article pages`);
    console.log(`- ${Object.keys(authors).length} author pages`);
  } catch (error) {
    console.error("Error generating site:", error);
    if (error && typeof error === "object" && "stack" in error) {
      console.error("Stack trace:", (error as { stack?: string }).stack);
    }
    process.exit(1);
  }
}

main();
