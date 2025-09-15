import path from "path";
import { writeFile } from "../utils/fileSystem.js";
import { TemplateEngine } from "../utils/templateEngine.js";
import {
  ArticleMetadata,
  SiteMetadata,
  AuthorMetadata,
  GeneratedContent,
} from "../types/index.js";

export class AuthorGenerator {
  private templateEngine: TemplateEngine;

  constructor(templateEngine: TemplateEngine) {
    this.templateEngine = templateEngine;
  }

  async generate(
    authorId: string,
    author: AuthorMetadata,
    authorArticles: GeneratedContent[],
    siteMetadata: SiteMetadata,
  ): Promise<void> {
    const articlesMetadata = authorArticles.map((article) => article.metadata);

    const htmlContent = await this.templateEngine.render("author", {
      site: siteMetadata,
      author,
      articles: articlesMetadata,
    });

    const outputPath = path.join("./dist", "authors", authorId, "index.html");
    await writeFile(outputPath, htmlContent);
  }
}
