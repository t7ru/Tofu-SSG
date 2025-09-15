import path from "path";
import { writeFile } from "../utils/fileSystem.js";
import { TemplateEngine } from "../utils/templateEngine.js";
import {
  ArticleMetadata,
  SiteMetadata,
  AuthorMetadata,
} from "../types/index.js";

export class IndexGenerator {
  private templateEngine: TemplateEngine;

  constructor(templateEngine: TemplateEngine) {
    this.templateEngine = templateEngine;
  }

  async generate(
    articles: ArticleMetadata[],
    siteMetadata: SiteMetadata,
    authors: Record<string, AuthorMetadata>,
  ): Promise<void> {
    const featuredArticles = articles.filter(
      (article) => article.featured === true,
    );

    const templateData = {
      site: siteMetadata,
      featuredArticles: featuredArticles.slice(0, 3),
      articles: articles.slice(0, 6),
      authors: authors,
      hero: {
        image: "/assets/images/hero.png",
        title: siteMetadata.title,
        subtitle: siteMetadata.description,
      },
    };

    console.log("Template data structure:", {
      site: !!templateData.site,
      featuredCount: templateData.featuredArticles.length,
      articlesCount: templateData.articles.length,
      authorsCount: Object.keys(templateData.authors).length,
      totalArticles: articles.length,
    });

    const htmlContent = await this.templateEngine.render("index", templateData);

    const outputPath = path.join("./dist", "index.html");
    await writeFile(outputPath, htmlContent);

    console.log(`Index page written to: ${outputPath}`);
  }
}
