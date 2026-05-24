export type BlogSectionType = 'heading' | 'paragraph' | 'list' | 'code';

export interface BlogSection {
  type: BlogSectionType;
  title?: string;
  text?: string;
  items?: string[];
  code?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  summary: string;
  date: string;
  author: string;
  readingTime: string;
  tags: string[];
  sections: BlogSection[];
}
