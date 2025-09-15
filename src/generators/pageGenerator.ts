import path from "path";
import fs from "fs-extra";
import { writeFile } from "../utils/fileSystem.js";
import { TemplateEngine } from "../utils/templateEngine.js";
import {
  SiteMetadata,
  AuthorMetadata,
  ArticleMetadata,
  GameMetadata,
} from "../types/index.js";

export class PageGenerator {
  private templateEngine: TemplateEngine;

  constructor(templateEngine: TemplateEngine) {
    this.templateEngine = templateEngine;
  }

  async generateNewsPage(
    articles: ArticleMetadata[],
    site: SiteMetadata,
  ): Promise<void> {
    const newsArticles = articles.filter(
      (a) => (a.tag || "").toLowerCase() === "news",
    );

    console.log("[Debug] News articles categoriesData:", newsArticles.map(a => ({
      title: a.title,
      categories: a.categories,
      categoriesData: JSON.stringify(a.categoriesData, null, 2)
    })));

    const html = await this.templateEngine.render("news", {
      site,
      articles: newsArticles,
      hero: {
        image: "/assets/images/hero-news.png",
        title: "Latest News",
        subtitle:
          "Updates, announcements, and developments for the games we cover.",
      },
    });
    await writeFile(path.join("./dist", "news", "index.html"), html);
  }

  async generateGuidesPage(
    articles: ArticleMetadata[],
    site: SiteMetadata,
  ): Promise<void> {
    const guideArticles = articles.filter(
      (a) => {
        const tag = (a.tag || "").toLowerCase();
        return tag === "guide" || tag === "guides";
      },
    );

    console.log("[Debug] Guide articles categoriesData:", guideArticles.map(a => ({
      title: a.title,
      categories: a.categories,
      categoriesData: JSON.stringify(a.categoriesData, null, 2)
    })));

    const html = await this.templateEngine.render("guides", {
      site,
      articles: guideArticles,
      hero: {
        image: "/assets/images/hero-guides.png",
        title: "Guides & Tutorials",
        subtitle:
          "In-depth strategy, progression help, and knowledge for players.",
      },
    });
    await writeFile(path.join("./dist", "guides", "index.html"), html);
  }

  async generateGamesPage(site: SiteMetadata): Promise<void> {
    const gamesData = await this.loadGames();
    console.log("Loaded games count:", gamesData.length);
    const hasGames = gamesData.length > 0;
    const noGames = !hasGames;
    const html = await this.templateEngine.render("games", {
      site,
      games: gamesData,
      hasGames,
      noGames,
      hero: {
        image: "/assets/images/hero-games.png",
        title: "Games",
        subtitle: "Select a game to view all related articles.",
      },
    });
    await writeFile(path.join("./dist", "games", "index.html"), html);
  }

  async generateCategoryPages(
    articles: ArticleMetadata[],
    site: SiteMetadata,
  ): Promise<void> {
    const catMap: Record< // in the future
      string,
      { name: string; slug: string; articles: ArticleMetadata; image?: string }[]
    > = {};

    function slugify(value: string) {
      return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    }

    const gamesData = await this.loadGames();

    const bySlugImage: Record<string, string | undefined> = {};
    gamesData.forEach((g) => {
      bySlugImage[g.slug] = g.image;
      bySlugImage[slugify(g.title)] = g.image;
    });

    const categoryArticles: Record<
      string,
      { name: string; slug: string; articles: ArticleMetadata[]; image?: string }
    > = {};

    for (const art of articles) {
      for (const cat of art.categories || []) {
        const slug = slugify(cat);
        if (!categoryArticles[slug]) {
          categoryArticles[slug] = {
            name: cat,
            slug,
            articles: [],
            image: bySlugImage[slug],
          };
        }
        categoryArticles[slug].articles.push(art);
      }
    }

    for (const entry of Object.values(categoryArticles)) {
      const html = await this.templateEngine.render("category", {
        site,
        category: entry.name,
        categorySlug: entry.slug,
        articles: entry.articles,
        hero: {
          image: entry.image || "/assets/images/hero-games.png",
          title: entry.name,
          subtitle: `Articles related to ${entry.name}`,
        },
      });
      await writeFile(
        path.join("./dist", "categories", entry.slug, "index.html"),
        html,
      );
    }
  }

  async generateAboutPage(
    siteMetadata: SiteMetadata,
    authors: Record<string, AuthorMetadata>,
  ): Promise<void> {
    const html = await this.templateEngine.render("about", {
      site: siteMetadata,
      authors,
      hero: {
        image: "/assets/images/hero-about.png",
        title: "About Us",
        subtitle:
          "Learn more about our stuff.",
      },
    });
    await writeFile(path.join("./dist", "about", "index.html"), html);
  }

  private async loadGames(): Promise<GameMetadata[]> {
    const gamesDir = path.join(process.cwd(), "content", "games");
    try {
      const exists = await fs.pathExists(gamesDir);
      if (!exists) return [];
      const files = await fs.readdir(gamesDir);
      const jsonFiles = files.filter((f) => f.toLowerCase().endsWith(".json"));
      const games: GameMetadata[] = [];
      for (const file of jsonFiles) {
        const full = path.join(gamesDir, file);
        try {
          const data = await fs.readJson(full);
          games.push({
            title: data.title || path.basename(file, ".json"),
            slug: data.slug || path.basename(file, ".json"),
            description: data.description || "",
            image: data.image,
            release: data.release,
            officialSite: data.officialSite,
          });
          console.log("[loadGames] Parsed", file, {
            title: data.title,
            slug: data.slug,
            image: data.image,
          });
        } catch (e) {
          console.warn(`Failed to parse game file ${file}:`, e);
        }
      }
      console.log("[loadGames] Total games:", games.length);
      return games;
    } catch {
      return [];
    }
  }
}
