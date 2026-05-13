// PM University content data
// Articles and categories for the PM University learning hub

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

export interface ArticleStep {
  title: string;
  description: string;
  annotations?: {
    type: 'arrow' | 'circle' | 'box';
    x: number;
    y: number;
    label?: string;
    color?: string;
  }[];
  tourSteps?: TourStep[];
}

export interface FAQ {
  question: string;
  answer: string;
}

export interface UniversityArticle {
  slug: string;
  title: string;
  description: string;
  category: string;
  icon: string;
  readTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  steps: ArticleStep[];
  faqs: FAQ[];
  relatedSlugs?: string[];
  proRequired?: boolean;
}

export interface UniversityCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  articleSlugs: string[];
}
