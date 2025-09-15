import fs from "fs-extra";
import path from "path";
import { TemplateData } from "../types/index.js";

export class TemplateEngine {
  private templatesDir: string;
  private layoutsDir: string;
  private partialsDir: string;
  private layoutCache: Map<string, string> = new Map();
  private templateCache: Map<string, string> = new Map();
  private partialCache: Map<string, string> = new Map();

  constructor(templatesDir: string) {
    this.templatesDir = templatesDir;
    this.layoutsDir = path.join(templatesDir, "layouts");
    this.partialsDir = path.join(templatesDir, "partials");
  }

  async loadTemplate(templateName: string): Promise<string> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }

    const templatePath = path.join(this.templatesDir, `${templateName}.html`);
    try {
      const template = await fs.readFile(templatePath, "utf-8");
      this.templateCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`Template not found: ${templatePath}`);
      throw error;
    }
  }

  async loadLayout(layoutName: string = "default"): Promise<string> {
    if (this.layoutCache.has(layoutName)) {
      return this.layoutCache.get(layoutName)!;
    }

    const layoutPath = path.join(this.layoutsDir, `${layoutName}.html`);
    try {
      const layout = await fs.readFile(layoutPath, "utf-8");
      this.layoutCache.set(layoutName, layout);
      return layout;
    } catch (error) {
      console.error(`Layout not found: ${layoutPath}`);
      throw error;
    }
  }

  async loadPartial(partialName: string): Promise<string> {
    if (this.partialCache.has(partialName)) {
      return this.partialCache.get(partialName)!;
    }

    const partialPath = path.join(this.partialsDir, `${partialName}.html`);
    try {
      const partial = await fs.readFile(partialPath, "utf-8");
      this.partialCache.set(partialName, partial);
      return partial;
    } catch (error) {
      console.warn(`Partial ${partialName} not found, removing placeholder`);
      return "";
    }
  }

  async render(
    templateName: string,
    data: TemplateData,
    layoutName: string = "default",
  ): Promise<string> {
    console.log(
      `Rendering template: ${templateName} with layout: ${layoutName}`,
    );
    console.log("Template data keys:", Object.keys(data));

    const enhancedData = {
      ...data,
      site: {
        ...data.site,
        currentPage: this.detectCurrentPage(templateName, data),
      },
    };

    let template = await this.loadTemplate(templateName);
    console.log("Template loaded, length:", template.length);

    template = await this.replacePartials(template);
    template = this.replaceData(template, enhancedData);
    console.log("After template data replacement, length:", template.length);

    try {
      const layout = await this.loadLayout(layoutName);
      let result = layout.replace(/\{\{\s*content\s*\}\}/g, template);

      result = await this.replacePartials(result);
      result = this.replaceData(result, enhancedData);
      console.log("Final result length:", result.length);

      return result;
    } catch (error) {
      console.log("No layout found, returning template directly");
      return template;
    }
  }

  private detectCurrentPage(
    templateName: string,
    data: TemplateData,
  ): Record<string, boolean> {
    const currentPage: Record<string, boolean> = {
      home: false,
      articles: false,
      guides: false,
      games: false,
      about: false,
    };

    switch (templateName) {
      case "index":
        currentPage.home = true;
        break;
      case "article":
      case "news":
        currentPage.articles = true;
        break;
      case "guides":
        currentPage.guides = true;
        break;
      case "games":
        currentPage.games = true;
        break;
      case "about":
        currentPage.about = true;
        break;
      default:
        if (data.article) {
          currentPage.articles = true;
        }
        break;
    }

    return currentPage;
  }

  private async replacePartials(content: string): Promise<string> {
    const partialRegex = /\{\{\s*>\s*([a-zA-Z0-9_-]+)\s*\}\}/g;
    let result = content;
    let hasReplacements = true;

    while (hasReplacements) {
      hasReplacements = false;
      const matches = Array.from(result.matchAll(partialRegex));
      console.log(
        "Found partials:",
        matches.map((m) => m[1]),
      );

      for (const match of matches) {
        const partialName = match[1];
        console.log(`Loading partial: ${partialName}`);
        const partial = await this.loadPartial(partialName);
        console.log(`Partial ${partialName} content length:`, partial.length);
        result = result.replace(match[0], partial);
        hasReplacements = true;
      }
    }

    return result;
  }

  private replaceData(content: string, data: TemplateData): string {
    let result = content;

    result = this.handleEachLoops(result, data);
    result = this.handleConditionals(result, data);
    result = this.handleSimpleVariables(result, data);

    return result;
  }

  private handleEachLoops(content: string, data: TemplateData): string {
    let result = content;
    let processed = true;

    while (processed) {
      processed = false;
      const loopRegex =
        /\{\{\s*#each\s+([a-zA-Z0-9_.]+)\s*\}\}((?:(?!\{\{\s*#each\s+)[\s\S])*?)\{\{\s*\/each\s*\}\}/g;

      result = result.replace(loopRegex, (_match, arrayPath, template) => {
        processed = true;
        const array = this.getNestedProperty(data, arrayPath);

        if (!Array.isArray(array) || array.length === 0) {
          return "";
        }

        return array
          .map((item) => {
            let itemTemplate = template;
            itemTemplate = this.handleItemConditionals(itemTemplate, item);

            const itemData = { item };
            const variableRegex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
            itemTemplate = itemTemplate.replace(
              variableRegex,
              (varMatch: string, variablePath: string) => {
                if (variablePath.startsWith("item.")) {
                  const value = this.getNestedProperty(itemData, variablePath);
                  return String(value || "");
                }
                return varMatch;
              },
            );

            return itemTemplate;
          })
          .join("");
      });
    }

    return result;
  }

  private handleItemConditionals(content: string, item: any): string {
    const conditionalRegex =
      /\{\{\s*#if\s+item\.([a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\s*\/if\s*\}\}/g;

    return content.replace(
      conditionalRegex,
      (_match, propertyPath, conditionalContent) => {
        const value = this.getNestedProperty(item, propertyPath);
        return value ? conditionalContent : "";
      },
    );
  }

  private handleConditionals(content: string, data: TemplateData): string {
    const conditionalRegex =
      /\{\{\s*#if\s+([a-zA-Z0-9_.]+)\s*\}\}([\s\S]*?)\{\{\s*\/if\s*\}\}/g;

    return content.replace(
      conditionalRegex,
      (_match, conditionPath, content) => {
        const value = this.getNestedProperty(data, conditionPath);
        return value ? content : "";
      },
    );
  }

  private handleSimpleVariables(content: string, data: TemplateData): string {
    const variableWithFallbackRegex =
      /\{\{\s*([a-zA-Z0-9_.]+)\s*\|\|\s*([a-zA-Z0-9_.]+|"[^"]*")\s*\}\}/g;
    content = content.replace(
      variableWithFallbackRegex,
      (_match, primaryPath, fallbackValue) => {
        const primaryValue = this.getNestedProperty(data, primaryPath);

        if (primaryValue) {
          return String(primaryValue);
        }

        if (fallbackValue.startsWith('"') && fallbackValue.endsWith('"')) {
          return fallbackValue.slice(1, -1);
        } else {
          const fallbackPathValue = this.getNestedProperty(data, fallbackValue);
          return String(fallbackPathValue || "");
        }
      },
    );

    const variableRegex = /\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g;
    return content.replace(variableRegex, (_match, variablePath) => {
      const value = this.getNestedProperty(data, variablePath);
      return String(value || "");
    });
  }

  private getNestedProperty(obj: any, path: string): any {
    console.log(`[NESTED] Getting property: ${path} from:`, typeof obj === 'object' ? Object.keys(obj) : obj);
    
    if (!path || typeof obj !== "object" || obj === null) {
      return undefined;
    }

    return path.split(".").reduce((current, key) => {
      const result = current && current[key];
      console.log(`[NESTED] Key: ${key}, Result:`, result);
      return result;
    }, obj);
  }
}
