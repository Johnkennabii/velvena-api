/**
 * Types pour les structures de templates JSON
 */

export interface TemplateMetadata {
  name: string;
  description?: string;
  category?: string;
}

export interface Section {
  id: string;
  type: string;
  title?: string;
  subtitle?: string;
  content?: any;
  style?: any;
  layout?: string;
  fields?: any[];
  columns?: any[];
  dataSource?: string;
  priceItems?: any[];
  showIf?: string;
}

export interface TemplateStructure {
  version: string;
  metadata: TemplateMetadata;
  sections: Section[];
}

export interface ContractTemplateData {
  [key: string]: any;
}
