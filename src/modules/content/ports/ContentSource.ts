import type { ContentItem } from '../contentLoader';

export interface ContentSource {
  list(): Promise<Omit<ContentItem, 'content'>[]>;
  getById(id: string): Promise<ContentItem | null>;
}
