export interface ArticleMetadata {
  title: string;
  date: string;
  author: string;
  categories: string[];
  categoriesData?: { name: string; slug: string }[];
  tag?: string;
  tagLink?: string;
  excerpt?: string;
  slug: string;
  featured?: boolean;
  description?: string;
  [key: string]: any;
}

export interface AuthorMetadata {
  name: string;
  bio?: string;
  profilePicture?: string;
  links?: {
    x?: string;
    github?: string;
    website?: string;
    [key: string]: string | undefined;
  };
  [key: string]: any;
}

export interface SiteMetadata {
  title: string;
  description: string;
  baseUrl: string;
  currentPage?: Record<string, boolean>;
  [key: string]: any;
}

export interface GeneratedContent {
  content: string;
  metadata: ArticleMetadata;
}

export interface Template {
  name: string;
  content: string;
}

export interface GameMetadata {
  title: string;
  slug: string;
  description?: string;
  image?: string;
  platform?: string;
  status?: string;
  releaseDate?: string;
  officialSite?: string;
  [key: string]: any;
}

export interface TemplateData {
  site: SiteMetadata;
  article?: ArticleMetadata;
  articles?: ArticleMetadata[];
  author?: AuthorMetadata;
  games?: GameMetadata[];
  content?: string;
  [key: string]: any;
}
