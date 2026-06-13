import type { ContentSource } from '../ports/ContentSource';
import { getAllContentMetadata, getContentById } from '../contentLoader';

export const localFilesContentSource: ContentSource = {
  list: () => getAllContentMetadata(),
  getById: (id) => getContentById(id),
};
