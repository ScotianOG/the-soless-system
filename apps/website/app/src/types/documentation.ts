// Documentation types

export interface DocItem {
  id: string;
  title: string;
  description: string;
  icon?: string;
  date: string;
  type: 'markdown' | 'pdf' | 'external';
  content?: string;
}
