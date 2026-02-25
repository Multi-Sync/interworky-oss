// src/assistant/modes/flowEngine/renderers/reportRenderer.js
/**
 * Report Renderer
 * General-purpose renderer for report-style outputs with sections,
 * key-value pairs, lists, and summary blocks.
 *
 * Expects data in the following structure:
 * {
 *   title: string,
 *   subtitle: string,
 *   sections: [
 *     { title: string, content: string | object | array }
 *   ],
 *   summary: string,
 *   metadata: { key: value }
 * }
 */

import { createElement } from '../../../ui/baseMethods';
import {
  registerRenderer,
  getTheme,
  createThemedSection,
} from './index';

/**
 * Render a report from flow data
 */
function renderReport(data, config) {
  const theme = getTheme(config?.theme);

  const container = createElement(
    'div',
    {
      padding: '48px',
      fontFamily: theme.fonts.body,
      lineHeight: '1.6',
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    { id: 'report-content' }
  );

  // Report Header
  const header = createElement(
    'div',
    {
      marginBottom: theme.spacing.xl,
      paddingBottom: theme.spacing.lg,
      borderBottom: `2px solid ${theme.colors.primary}`,
    },
    {}
  );

  if (data.title) {
    const title = createElement(
      'h1',
      {
        fontSize: '28px',
        fontWeight: 'bold',
        fontFamily: theme.fonts.heading,
        margin: '0 0 8px 0',
        color: theme.colors.text,
      },
      { textContent: data.title }
    );
    header.appendChild(title);
  }

  if (data.subtitle) {
    const subtitle = createElement(
      'p',
      {
        fontSize: '16px',
        color: theme.colors.textMuted,
        margin: '0',
      },
      { textContent: data.subtitle }
    );
    header.appendChild(subtitle);
  }

  // Metadata bar
  if (data.metadata && Object.keys(data.metadata).length > 0) {
    const metaBar = createElement(
      'div',
      {
        display: 'flex',
        gap: theme.spacing.md,
        flexWrap: 'wrap',
        marginTop: theme.spacing.md,
        fontSize: '14px',
        color: theme.colors.textMuted,
      },
      {}
    );

    Object.entries(data.metadata).forEach(([key, value]) => {
      const metaItem = createElement(
        'span',
        {
          padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.sm,
        },
        { textContent: `${formatLabel(key)}: ${value}` }
      );
      metaBar.appendChild(metaItem);
    });

    header.appendChild(metaBar);
  }

  container.appendChild(header);

  // Summary block (if at top)
  if (data.summary && !data.summaryPosition) {
    const summaryBlock = createSummaryBlock(data.summary, theme);
    container.appendChild(summaryBlock);
  }

  // Sections
  if (data.sections && data.sections.length > 0) {
    data.sections.forEach((section) => {
      const sectionEl = renderSection(section, theme);
      container.appendChild(sectionEl);
    });
  }

  // Summary block (if at bottom)
  if (data.summary && data.summaryPosition === 'bottom') {
    const summaryBlock = createSummaryBlock(data.summary, theme);
    container.appendChild(summaryBlock);
  }

  // Collected data sections (from tool calls)
  const toolData = Object.entries(data).filter(
    ([key]) => !['title', 'subtitle', 'sections', 'summary', 'metadata', 'summaryPosition', '_completion'].includes(key)
  );

  if (toolData.length > 0) {
    const collectedSection = createThemedSection('Collected Information', theme);

    toolData.forEach(([key, value]) => {
      const item = renderDataItem(key, value, theme);
      collectedSection.appendChild(item);
    });

    container.appendChild(collectedSection);
  }

  // Completion data (AI analysis results)
  if (data._completion) {
    const completionSection = createThemedSection('Analysis Results', theme);
    const completionContent = renderDataItem('results', data._completion, theme);
    completionSection.appendChild(completionContent);
    container.appendChild(completionSection);
  }

  return container;
}

/**
 * Render a section
 */
function renderSection(section, theme) {
  const sectionEl = createElement(
    'div',
    {
      marginBottom: theme.spacing.lg,
    },
    {}
  );

  if (section.title) {
    const titleEl = createElement(
      'h2',
      {
        fontSize: '18px',
        fontWeight: 'bold',
        fontFamily: theme.fonts.heading,
        color: theme.colors.text,
        borderBottom: `1px solid ${theme.colors.border}`,
        paddingBottom: theme.spacing.sm,
        marginBottom: theme.spacing.md,
      },
      { textContent: section.title }
    );
    sectionEl.appendChild(titleEl);
  }

  // Render content based on type
  const contentEl = renderContent(section.content, theme);
  sectionEl.appendChild(contentEl);

  return sectionEl;
}

/**
 * Render content based on type
 */
function renderContent(content, theme) {
  if (typeof content === 'string') {
    return createElement(
      'p',
      {
        fontSize: '14px',
        color: theme.colors.text,
        margin: '0',
        whiteSpace: 'pre-wrap',
      },
      { textContent: content }
    );
  }

  if (Array.isArray(content)) {
    const list = createElement(
      'ul',
      {
        margin: '0',
        paddingLeft: '20px',
        fontSize: '14px',
        color: theme.colors.text,
      },
      {}
    );

    content.forEach((item) => {
      const li = createElement(
        'li',
        {
          marginBottom: theme.spacing.xs,
        },
        { textContent: typeof item === 'object' ? JSON.stringify(item) : item }
      );
      list.appendChild(li);
    });

    return list;
  }

  if (typeof content === 'object') {
    const grid = createElement(
      'div',
      {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: theme.spacing.sm,
        fontSize: '14px',
      },
      {}
    );

    Object.entries(content).forEach(([key, value]) => {
      const label = createElement(
        'span',
        {
          fontWeight: '600',
          color: theme.colors.textMuted,
        },
        { textContent: `${formatLabel(key)}:` }
      );

      const valueEl = createElement(
        'span',
        {
          color: theme.colors.text,
        },
        { textContent: typeof value === 'object' ? JSON.stringify(value) : value }
      );

      grid.appendChild(label);
      grid.appendChild(valueEl);
    });

    return grid;
  }

  return createElement('span', {}, { textContent: String(content) });
}

/**
 * Render a data item (from tool calls)
 */
function renderDataItem(key, value, theme) {
  const item = createElement(
    'div',
    {
      marginBottom: theme.spacing.md,
      padding: theme.spacing.md,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      borderLeft: `3px solid ${theme.colors.primary}`,
    },
    {}
  );

  const label = createElement(
    'div',
    {
      fontSize: '12px',
      fontWeight: '600',
      color: theme.colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: theme.spacing.xs,
    },
    { textContent: formatLabel(key) }
  );
  item.appendChild(label);

  const contentEl = renderContent(
    Array.isArray(value) ? value[0] : value,
    theme
  );
  item.appendChild(contentEl);

  return item;
}

/**
 * Create summary block
 */
function createSummaryBlock(summary, theme) {
  const block = createElement(
    'div',
    {
      padding: theme.spacing.lg,
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.xl,
      borderLeft: `4px solid ${theme.colors.success}`,
    },
    {}
  );

  const text = createElement(
    'p',
    {
      fontSize: '15px',
      fontStyle: 'italic',
      color: theme.colors.text,
      margin: '0',
      lineHeight: '1.7',
    },
    { textContent: summary }
  );

  block.appendChild(text);
  return block;
}

/**
 * Format key to label (snake_case to Title Case)
 */
function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Generate plain text report
 */
function toPlainText(data) {
  const lines = [];

  if (data.title) {
    lines.push(data.title.toUpperCase());
    lines.push('='.repeat(data.title.length));
    lines.push('');
  }

  if (data.subtitle) {
    lines.push(data.subtitle);
    lines.push('');
  }

  if (data.metadata) {
    Object.entries(data.metadata).forEach(([key, value]) => {
      lines.push(`${formatLabel(key)}: ${value}`);
    });
    lines.push('');
  }

  if (data.summary) {
    lines.push('SUMMARY');
    lines.push('-'.repeat(20));
    lines.push(data.summary);
    lines.push('');
  }

  if (data.sections) {
    data.sections.forEach((section) => {
      if (section.title) {
        lines.push(section.title.toUpperCase());
        lines.push('-'.repeat(section.title.length));
      }

      if (typeof section.content === 'string') {
        lines.push(section.content);
      } else if (Array.isArray(section.content)) {
        section.content.forEach((item) => {
          lines.push(`  • ${typeof item === 'object' ? JSON.stringify(item) : item}`);
        });
      } else if (typeof section.content === 'object') {
        Object.entries(section.content).forEach(([key, value]) => {
          lines.push(`  ${formatLabel(key)}: ${value}`);
        });
      }

      lines.push('');
    });
  }

  return lines.join('\n');
}

/**
 * Generate HTML for export
 */
function toHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title || 'Report'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
    }
    h1 {
      font-size: 28px;
      border-bottom: 2px solid #1f2937;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    h2 {
      font-size: 18px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 8px;
      margin-top: 32px;
    }
    .subtitle { color: #6b7280; margin-bottom: 24px; }
    .metadata {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 24px;
    }
    .meta-item {
      background: #f9fafb;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      color: #6b7280;
    }
    .summary {
      background: #f9fafb;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #059669;
      font-style: italic;
      margin-bottom: 32px;
    }
    .section { margin-bottom: 24px; }
    .data-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px;
    }
    .data-label { font-weight: 600; color: #6b7280; }
    ul { padding-left: 20px; }
  </style>
</head>
<body>
  ${data.title ? `<h1>${data.title}</h1>` : ''}
  ${data.subtitle ? `<p class="subtitle">${data.subtitle}</p>` : ''}

  ${data.metadata ? `
  <div class="metadata">
    ${Object.entries(data.metadata).map(([k, v]) => `<span class="meta-item">${formatLabel(k)}: ${v}</span>`).join('')}
  </div>
  ` : ''}

  ${data.summary ? `<div class="summary">${data.summary}</div>` : ''}

  ${data.sections ? data.sections.map((section) => `
  <div class="section">
    ${section.title ? `<h2>${section.title}</h2>` : ''}
    ${typeof section.content === 'string' ? `<p>${section.content}</p>` : ''}
    ${Array.isArray(section.content) ? `<ul>${section.content.map((item) => `<li>${item}</li>`).join('')}</ul>` : ''}
    ${typeof section.content === 'object' && !Array.isArray(section.content) ? `
    <div class="data-grid">
      ${Object.entries(section.content).map(([k, v]) => `
        <span class="data-label">${formatLabel(k)}:</span>
        <span>${v}</span>
      `).join('')}
    </div>
    ` : ''}
  </div>
  `).join('') : ''}
</body>
</html>
  `.trim();
}

// Register the report renderer
registerRenderer('report', {
  render: renderReport,
  toPlainText,
  toHTML,
});

export { renderReport, toPlainText, toHTML };
