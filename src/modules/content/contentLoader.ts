// Content loader utility functions
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// Interface for content metadata and data
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

const CONTENT_DIRECTORY = path.join(process.cwd(), 'public', 'content', 'finnish');

// Get all content files
export async function getContentFiles() {
  try {
    // Ensure the directory exists
    if (!fs.existsSync(CONTENT_DIRECTORY)) {
      fs.mkdirSync(CONTENT_DIRECTORY, { recursive: true });
    }
    
    const fileNames = fs.readdirSync(CONTENT_DIRECTORY);
    return fileNames.filter(file => file.endsWith('.md'));
  } catch (error) {
    console.error('Error reading content directory:', error);
    return [];
  }
}

// Get content metadata for all files
export async function getAllContentMetadata(): Promise<Omit<ContentItem, 'content'>[]> {
  const fileNames = await getContentFiles();
  
  const allContent = fileNames.map(fileName => {
    const id = fileName.replace(/\.md$/, '');
    const fullPath = path.join(CONTENT_DIRECTORY, fileName);
    
    // Read file and parse frontmatter
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data } = matter(fileContents);
    
    return {
      id,
      title: data.title || id,
      description: data.description || '',
      difficulty: data.difficulty || 'beginner',
      tags: data.tags || [],
    };
  });
  
  // Sort by difficulty level and then title
  return allContent.sort((a, b) => {
    const difficultyOrder: Record<string, number> = { 
      beginner: 1, 
      intermediate: 2, 
      advanced: 3 
    };
    
    if (difficultyOrder[a.difficulty as keyof typeof difficultyOrder] !== difficultyOrder[b.difficulty as keyof typeof difficultyOrder]) {
      return difficultyOrder[a.difficulty as keyof typeof difficultyOrder] - difficultyOrder[b.difficulty as keyof typeof difficultyOrder];
    }
    return a.title.localeCompare(b.title);
  });
}

// Get a specific content file by ID
export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const fullPath = path.join(CONTENT_DIRECTORY, `${id}.md`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    
    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);
    
    return {
      id,
      title: data.title || id,
      description: data.description || '',
      content: content,
      difficulty: data.difficulty || 'beginner',
      tags: data.tags || [],
    };
  } catch (error) {
    console.error(`Error reading content file ${id}:`, error);
    return null;
  }
}