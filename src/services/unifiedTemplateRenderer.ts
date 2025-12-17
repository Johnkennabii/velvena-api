/**
 * Service de rendu unifié pour les templates JSON
 * Génère du HTML à partir de la structure JSON
 */

import type {
  TemplateStructure,
  Section,
  ContractTemplateData,
} from '../types/templateStructure.js';

// Ré-exporter les types pour faciliter l'import
export type { TemplateStructure, Section, ContractTemplateData };

/**
 * Classe principale de rendu de templates
 */
export class TemplateRenderer {
  /**
   * Rendre le template complet en HTML
   */
  render(structure: TemplateStructure, data: ContractTemplateData): string {
    let html = this.generateHTMLHeader(structure.metadata.name);

    for (const section of structure.sections) {
      // Vérifier condition d'affichage
      if (section.showIf && !this.evaluateCondition(section.showIf, data)) {
        continue;
      }

      html += this.renderSection(section, data);
    }

    html += this.generateHTMLFooter();
    return html;
  }

  /**
   * Générer l'en-tête HTML avec styles
   */
  private generateHTMLHeader(title: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }

    body {
      font-family: Arial, Helvetica, sans-serif;
      font-size: 12px;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 20px;
    }

    h1 {
      font-size: 24px;
      font-weight: 600;
      color: #111;
      text-align: center;
      margin: 0 0 8px 0;
    }

    h2 {
      font-size: 16px;
      font-weight: 600;
      color: #111;
      margin: 24px 0 12px 0;
    }

    h3 {
      font-size: 14px;
      font-weight: 600;
      color: #111;
      margin: 16px 0 8px 0;
    }

    p {
      margin: 8px 0;
    }

    .text-center {
      text-align: center;
    }

    .text-small {
      font-size: 11px;
      color: #666;
    }

    .text-xs {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 600;
      color: #888;
    }

    .section {
      margin-bottom: 24px;
    }

    .grid {
      display: table;
      width: 100%;
      margin: 12px 0;
    }

    .grid-item {
      display: table-cell;
      width: 50%;
      padding: 8px;
      vertical-align: top;
    }

    .grid-single .grid-item {
      width: 100%;
    }

    .price-summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-top: 12px;
    }

    .box {
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 12px;
      background-color: #fafafa;
    }

    .box-blue {
      background-color: #eff6ff;
      border-color: #dbeafe;
    }

    .box-green {
      background-color: #f0fdf4;
      border-color: #dcfce7;
    }

    .price-large {
      font-size: 18px;
      font-weight: 600;
      color: #111;
      margin-top: 4px;
    }

    .price-blue {
      color: #1d4ed8;
    }

    .price-green {
      color: #15803d;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
    }

    th {
      background-color: #f3f4f6;
      border: 1px solid #e5e5e5;
      padding: 8px;
      text-align: left;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
    }

    td {
      border: 1px solid #e5e5e5;
      padding: 8px;
      font-size: 11px;
    }

    .label {
      display: block;
      margin-bottom: 4px;
    }

    .value {
      display: block;
      color: #111;
      font-weight: 500;
    }

    ul {
      margin: 8px 0;
      padding-left: 24px;
    }

    li {
      margin: 4px 0;
    }

    .spacer {
      height: 24px;
    }
  </style>
</head>
<body>
`;
  }

  private generateHTMLFooter(): string {
    return `
</body>
</html>
`;
  }

  /**
   * Rendre une section selon son type
   */
  private renderSection(section: Section, data: ContractTemplateData): string {
    switch (section.type) {
      case 'header':
        return this.renderHeader(section, data);
      case 'info_block':
        return this.renderInfoBlock(section, data);
      case 'table':
        return this.renderTable(section, data);
      case 'price_summary':
        return this.renderPriceSummary(section, data);
      case 'rich_text':
        return this.renderRichText(section, data);
      case 'list':
        return this.renderList(section, data);
      case 'spacer':
        return this.renderSpacer(section);
      default:
        return '';
    }
  }

  /**
   * Rendre un en-tête
   */
  private renderHeader(section: Section, data: ContractTemplateData): string {
    const title = this.replaceVariables(section.content?.title || '', data);
    const subtitle = this.replaceVariables(section.content?.subtitle || '', data);
    const align = section.style?.textAlign || 'center';

    let html = `<div class="section text-${align}">`;
    if (title) {
      html += `<h1>${title}</h1>`;
    }
    if (subtitle) {
      html += `<p class="text-small">${subtitle}</p>`;
    }
    html += `</div>`;

    return html;
  }

  /**
   * Rendre un bloc d'informations
   */
  private renderInfoBlock(section: Section, data: ContractTemplateData): string {
    const layout = section.layout || 'two-columns';
    const gridClass = layout === 'single' ? 'grid grid-single' : 'grid';

    let html = `<div class="section">`;
    if (section.title) {
      html += `<h2>${section.title}</h2>`;
    }
    html += `<div class="${gridClass}">`;

    for (const field of section.fields || []) {
      const value = this.resolveVariable(field.variable, data);
      const formattedValue = this.formatValue(value, field.format);

      html += `
        <div class="grid-item">
          <p class="text-xs label">${field.label}</p>
          <p class="value">${formattedValue}</p>
        </div>
      `;
    }

    html += `</div></div>`;
    return html;
  }

  /**
   * Rendre un tableau
   */
  private renderTable(section: Section, data: ContractTemplateData): string {
    const items = this.resolveVariable(section.dataSource!, data) as any[] || [];

    if (items.length === 0) return '';

    let html = `<div class="section">`;
    if (section.title) {
      html += `<h2>${section.title}</h2>`;
    }
    html += `<table>`;

    // Header
    html += `<thead><tr>`;
    for (const col of section.columns || []) {
      const width = col.width ? ` style="width: ${col.width}"` : '';
      html += `<th${width}>${col.header}</th>`;
    }
    html += `</tr></thead>`;

    // Rows
    html += `<tbody>`;
    for (const item of items) {
      html += `<tr>`;
      for (const col of section.columns || []) {
        let value = item[col.field];
        value = this.formatValue(value, col.format);
        html += `<td>${value || '-'}</td>`;
      }
      html += `</tr>`;
    }
    html += `</tbody></table></div>`;

    return html;
  }

  /**
   * Rendre un résumé de prix
   */
  private renderPriceSummary(section: Section, data: ContractTemplateData): string {
    let html = `<div class="section">`;
    if (section.title) {
      html += `<h2>${section.title}</h2>`;
    }

    html += `<div class="price-summary-grid">`;

    for (const item of section.priceItems || []) {
      const value = this.resolveVariable(item.variable, data);
      const boxClass = item.variant ? `box box-${item.variant}` : 'box';
      const priceClass = item.variant ? `price-large price-${item.variant}` : 'price-large';

      html += `
        <div class="${boxClass}">
          <p class="text-xs">${item.label}</p>
          <p class="${priceClass}">${value} €</p>
        </div>
      `;
    }

    html += `</div></div>`;
    return html;
  }

  /**
   * Rendre du texte riche
   */
  private renderRichText(section: Section, data: ContractTemplateData): string {
    const content = this.replaceVariables(section.content || '', data);

    let html = `<div class="section">`;
    if (section.title) {
      html += `<h2>${section.title}</h2>`;
    }
    html += content;
    html += `</div>`;

    return html;
  }

  /**
   * Rendre une liste
   */
  private renderList(section: Section, data: ContractTemplateData): string {
    const items = this.resolveVariable(section.dataSource!, data) as any[] || [];

    if (items.length === 0) return '';

    let html = `<div class="section">`;
    if (section.title) {
      html += `<h2>${section.title}</h2>`;
    }
    html += `<ul>`;

    for (const item of items) {
      const content = this.replaceVariables(section.content?.itemTemplate || '{{name}}', item);
      html += `<li>${content}</li>`;
    }

    html += `</ul></div>`;
    return html;
  }

  /**
   * Rendre un espaceur
   */
  private renderSpacer(section: Section): string {
    const height = section.style?.height || '24px';
    return `<div class="spacer" style="height: ${height}"></div>`;
  }

  /**
   * Résoudre une variable (supporte concaténation et chemins imbriqués)
   */
  private resolveVariable(variablePath: string, data: any): any {
    // Gestion de la concaténation (ex: "customer_firstname + customer_lastname")
    if (variablePath.includes('+')) {
      const parts = variablePath.split('+').map(p => p.trim());
      return parts.map(p => this.getNestedValue(data, p) || '').join(' ').trim();
    }

    // Chemin simple ou imbriqué (ex: "org.name")
    return this.getNestedValue(data, variablePath);
  }

  /**
   * Obtenir une valeur imbriquée (ex: "org.name")
   */
  private getNestedValue(obj: any, path: string): any {
    if (!obj || !path) return undefined;
    return path.split('.').reduce((acc, part) => acc?.[part], obj);
  }

  /**
   * Remplacer les variables dans un texte (ex: "Contrat {{contract_number}}")
   */
  private replaceVariables(text: string, data: ContractTemplateData): string {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
      const value = this.resolveVariable(variable.trim(), data);
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Formater une valeur selon son type
   */
  private formatValue(value: any, format?: string): string {
    if (value === undefined || value === null) return '-';

    switch (format) {
      case 'currency':
        return `${value} €`;
      case 'date':
        return this.formatDate(value);
      case 'datetime':
        return this.formatDateTime(value);
      default:
        return String(value);
    }
  }

  /**
   * Formater une date (DD/MM/YYYY)
   */
  private formatDate(value: string): string {
    if (!value) return '-';
    // Si déjà formaté, retourner tel quel
    if (value.match(/^\d{2}\/\d{2}\/\d{4}/)) return value;
    // Sinon, parser et formater
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleDateString('fr-FR');
  }

  /**
   * Formater une date avec heure (DD/MM/YYYY HH:mm)
   */
  private formatDateTime(value: string): string {
    if (!value) return '-';
    // Si déjà formaté, retourner tel quel
    if (value.match(/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}/)) return value;
    // Sinon, parser et formater
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    return date.toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Évaluer une condition simple (ex: "dresses.length > 0")
   */
  private evaluateCondition(condition: string, data: any): boolean {
    try {
      // Condition sur longueur d'array
      const lengthMatch = condition.match(/([\w.]+)\.length\s*([><=]+)\s*(\d+)/);
      if (lengthMatch) {
        const [, path, operator, target] = lengthMatch;
        const value = this.resolveVariable(path, data);
        const length = Array.isArray(value) ? value.length : 0;
        const targetNum = parseInt(target);

        switch (operator) {
          case '>': return length > targetNum;
          case '<': return length < targetNum;
          case '>=': return length >= targetNum;
          case '<=': return length <= targetNum;
          case '==': return length === targetNum;
          default: return false;
        }
      }

      // Condition d'existence
      const existsMatch = condition.match(/^([\w.]+)$/);
      if (existsMatch) {
        const value = this.resolveVariable(existsMatch[1], data);
        return !!value;
      }

      return true;
    } catch {
      return true; // En cas d'erreur, afficher la section
    }
  }
}

// Instance singleton
export const templateRenderer = new TemplateRenderer();
