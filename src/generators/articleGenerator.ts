import path from "path";
import { writeFile } from "../utils/fileSystem.js";
import { TemplateEngine } from "../utils/templateEngine.js";
import {
  GeneratedContent,
  SiteMetadata,
  AuthorMetadata,
} from "../types/index.js";

export class ArticleGenerator {
  private templateEngine: TemplateEngine;

  constructor(templateEngine: TemplateEngine) {
    this.templateEngine = templateEngine;
  }

  async generate(
    article: GeneratedContent,
    siteMetadata: SiteMetadata,
    authors: Record<string, AuthorMetadata>,
  ): Promise<void> {
    const { content, metadata } = article;
    const author = authors[metadata.author] || {
      name: metadata.author,
      bio: "",
      links: {},
    };

    const htmlContent = await this.templateEngine.render("article", {
      site: siteMetadata,
      article: metadata,
      author,
      content,
    });

    const outputPath = path.join(
      "./dist",
      "articles",
      metadata.slug,
      "index.html",
    );
    await writeFile(outputPath, htmlContent);
  }
}
