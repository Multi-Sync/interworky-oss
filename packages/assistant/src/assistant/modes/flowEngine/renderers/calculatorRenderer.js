// src/assistant/modes/flowEngine/renderers/calculatorRenderer.js
/**
 * Calculator Renderer
 * For displaying calculation results with inputs, results, and breakdowns.
 * Suitable for: mortgage calculators, ROI calculators, pricing calculators, etc.
 *
 * Expects data structure:
 * {
 *   inputs: { label: value },          // User inputs
 *   result: { value, label, unit },    // Primary result
 *   breakdown: [                        // Detailed breakdown
 *     { label, value, description }
 *   ],
 *   chart: {                           // Optional chart data
 *     type: 'bar' | 'pie',
 *     data: [{ label, value, color }]
 *   },
 *   recommendations: string[],         // Tips or recommendations
 *   _completion: object                // AI analysis
 * }
 */

import { createElement } from '../../../ui/baseMethods';
import { registerRenderer, getTheme, createThemedCard } from './index';

/**
 * Render calculator results
 */
function renderCalculator(data, config) {
  const theme = getTheme(config?.theme);

  const container = createElement(
    'div',
    {
      padding: '32px',
      fontFamily: theme.fonts.body,
      lineHeight: '1.6',
      color: theme.colors.text,
      backgroundColor: theme.colors.background,
    },
    { id: 'calculator-content' }
  );

  // Title
  if (data.title) {
    const header = createElement(
      'h1',
      {
        fontSize: '24px',
        fontWeight: 'bold',
        fontFamily: theme.fonts.heading,
        color: theme.colors.text,
        marginBottom: theme.spacing.lg,
        textAlign: 'center',
      },
      { textContent: data.title }
    );
    container.appendChild(header);
  }

  // Primary Result - Big number display
  if (data.result) {
    const resultCard = createElement(
      'div',
      {
        textAlign: 'center',
        padding: theme.spacing.xl,
        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${adjustColor(theme.colors.primary, -20)} 100%)`,
        borderRadius: theme.borderRadius.lg,
        color: '#ffffff',
        marginBottom: theme.spacing.lg,
        boxShadow: theme.shadows.lg,
      },
      {}
    );

    if (data.result.label) {
      const resultLabel = createElement(
        'div',
        {
          fontSize: '14px',
          opacity: '0.9',
          marginBottom: theme.spacing.sm,
          textTransform: 'uppercase',
          letterSpacing: '1px',
        },
        { textContent: data.result.label }
      );
      resultCard.appendChild(resultLabel);
    }

    const resultValue = createElement(
      'div',
      {
        fontSize: '48px',
        fontWeight: 'bold',
        marginBottom: theme.spacing.xs,
      },
      { textContent: formatValue(data.result.value, data.result.format) }
    );
    resultCard.appendChild(resultValue);

    if (data.result.unit) {
      const resultUnit = createElement(
        'div',
        {
          fontSize: '14px',
          opacity: '0.8',
        },
        { textContent: data.result.unit }
      );
      resultCard.appendChild(resultUnit);
    }

    if (data.result.description) {
      const desc = createElement(
        'p',
        {
          fontSize: '14px',
          marginTop: theme.spacing.md,
          opacity: '0.9',
        },
        { textContent: data.result.description }
      );
      resultCard.appendChild(desc);
    }

    container.appendChild(resultCard);
  }

  // Inputs Summary
  if (data.inputs && Object.keys(data.inputs).length > 0) {
    const inputsCard = createThemedCard('Your Inputs', theme, theme.colors.textMuted);

    const inputsGrid = createElement(
      'div',
      {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
        gap: theme.spacing.md,
      },
      {}
    );

    Object.entries(data.inputs).forEach(([key, value]) => {
      const inputBox = createElement(
        'div',
        {
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background,
          borderRadius: theme.borderRadius.md,
          textAlign: 'center',
        },
        {}
      );

      const label = createElement(
        'div',
        {
          fontSize: '11px',
          color: theme.colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: theme.spacing.xs,
        },
        { textContent: formatLabel(key) }
      );

      const val = createElement(
        'div',
        {
          fontSize: '18px',
          fontWeight: '600',
          color: theme.colors.text,
        },
        { textContent: typeof value === 'object' ? value.display || value.value : value }
      );

      inputBox.appendChild(label);
      inputBox.appendChild(val);
      inputsGrid.appendChild(inputBox);
    });

    inputsCard.appendChild(inputsGrid);
    container.appendChild(inputsCard);
  }

  // Breakdown / Details
  if (data.breakdown && data.breakdown.length > 0) {
    const breakdownCard = createThemedCard('Breakdown', theme, theme.colors.secondary);

    data.breakdown.forEach((item, index) => {
      const row = createElement(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: `${theme.spacing.md} 0`,
          borderBottom: index < data.breakdown.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
        },
        {}
      );

      const labelContainer = createElement('div', {}, {});

      const label = createElement(
        'div',
        {
          fontSize: '15px',
          fontWeight: '500',
          color: theme.colors.text,
        },
        { textContent: item.label }
      );
      labelContainer.appendChild(label);

      if (item.description) {
        const desc = createElement(
          'div',
          {
            fontSize: '12px',
            color: theme.colors.textMuted,
            marginTop: '2px',
          },
          { textContent: item.description }
        );
        labelContainer.appendChild(desc);
      }

      const value = createElement(
        'div',
        {
          fontSize: '16px',
          fontWeight: '600',
          color: item.highlight ? theme.colors.primary : theme.colors.text,
          fontFamily: theme.fonts.mono,
        },
        { textContent: formatValue(item.value, item.format) }
      );

      row.appendChild(labelContainer);
      row.appendChild(value);
      breakdownCard.appendChild(row);
    });

    container.appendChild(breakdownCard);
  }

  // Simple Bar Chart
  if (data.chart) {
    const chartCard = createThemedCard(data.chart.title || 'Distribution', theme);
    const chartEl = renderChart(data.chart, theme);
    chartCard.appendChild(chartEl);
    container.appendChild(chartCard);
  }

  // Recommendations
  if (data.recommendations && data.recommendations.length > 0) {
    const recsCard = createThemedCard('Recommendations', theme, theme.colors.success);

    data.recommendations.forEach((rec, index) => {
      const recItem = createElement(
        'div',
        {
          display: 'flex',
          alignItems: 'flex-start',
          gap: theme.spacing.sm,
          padding: theme.spacing.md,
          backgroundColor: theme.colors.background,
          borderRadius: theme.borderRadius.md,
          marginBottom: index < data.recommendations.length - 1 ? theme.spacing.sm : '0',
        },
        {}
      );

      const num = createElement(
        'span',
        {
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: theme.colors.success,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          flexShrink: '0',
        },
        { textContent: `${index + 1}` }
      );

      const text = createElement(
        'span',
        {
          fontSize: '14px',
          color: theme.colors.text,
        },
        { textContent: rec }
      );

      recItem.appendChild(num);
      recItem.appendChild(text);
      recsCard.appendChild(recItem);
    });

    container.appendChild(recsCard);
  }

  // Completion data (AI analysis)
  if (data._completion) {
    const analysisCard = createThemedCard('Analysis', theme, theme.colors.primary);

    if (typeof data._completion === 'string') {
      const text = createElement(
        'p',
        {
          fontSize: '14px',
          color: theme.colors.text,
          margin: '0',
          lineHeight: '1.7',
        },
        { textContent: data._completion }
      );
      analysisCard.appendChild(text);
    } else if (typeof data._completion === 'object') {
      Object.entries(data._completion).forEach(([key, value]) => {
        const row = createElement(
          'div',
          {
            marginBottom: theme.spacing.md,
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
            marginBottom: theme.spacing.xs,
          },
          { textContent: formatLabel(key) }
        );

        const val = createElement(
          'div',
          {
            fontSize: '14px',
            color: theme.colors.text,
          },
          { textContent: typeof value === 'object' ? JSON.stringify(value) : String(value) }
        );

        row.appendChild(label);
        row.appendChild(val);
        analysisCard.appendChild(row);
      });
    }

    container.appendChild(analysisCard);
  }

  return container;
}

/**
 * Render a simple bar chart
 */
function renderChart(chart, theme) {
  const container = createElement(
    'div',
    { marginTop: theme.spacing.md },
    {}
  );

  if (chart.type === 'bar' && chart.data) {
    const maxValue = Math.max(...chart.data.map((d) => d.value));

    chart.data.forEach((item) => {
      const row = createElement(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          marginBottom: theme.spacing.sm,
        },
        {}
      );

      const label = createElement(
        'div',
        {
          width: '80px',
          fontSize: '13px',
          color: theme.colors.textMuted,
          flexShrink: '0',
        },
        { textContent: item.label }
      );

      const barContainer = createElement(
        'div',
        {
          flex: '1',
          height: '24px',
          backgroundColor: theme.colors.border,
          borderRadius: theme.borderRadius.sm,
          overflow: 'hidden',
          marginRight: theme.spacing.sm,
        },
        {}
      );

      const percentage = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
      const bar = createElement(
        'div',
        {
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: item.color || theme.colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          paddingRight: '8px',
          color: '#fff',
          fontSize: '11px',
          fontWeight: '600',
          transition: 'width 0.3s ease',
        },
        { textContent: formatValue(item.value, item.format) }
      );

      barContainer.appendChild(bar);
      row.appendChild(label);
      row.appendChild(barContainer);
      container.appendChild(row);
    });
  } else if (chart.type === 'pie' && chart.data) {
    // Simple stacked bar as pie alternative
    const total = chart.data.reduce((sum, d) => sum + d.value, 0);

    const barRow = createElement(
      'div',
      {
        display: 'flex',
        height: '32px',
        borderRadius: theme.borderRadius.md,
        overflow: 'hidden',
        marginBottom: theme.spacing.md,
      },
      {}
    );

    chart.data.forEach((item) => {
      const percentage = total > 0 ? (item.value / total) * 100 : 0;
      const segment = createElement(
        'div',
        {
          width: `${percentage}%`,
          height: '100%',
          backgroundColor: item.color || theme.colors.primary,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: '11px',
          fontWeight: '600',
        },
        { textContent: percentage >= 10 ? `${Math.round(percentage)}%` : '' }
      );
      barRow.appendChild(segment);
    });

    container.appendChild(barRow);

    // Legend
    const legend = createElement(
      'div',
      {
        display: 'flex',
        flexWrap: 'wrap',
        gap: theme.spacing.md,
        justifyContent: 'center',
      },
      {}
    );

    chart.data.forEach((item) => {
      const legendItem = createElement(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.xs,
          fontSize: '13px',
        },
        {}
      );

      const dot = createElement(
        'span',
        {
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: item.color || theme.colors.primary,
        },
        {}
      );

      const text = createElement(
        'span',
        { color: theme.colors.textMuted },
        { textContent: `${item.label}: ${formatValue(item.value, item.format)}` }
      );

      legendItem.appendChild(dot);
      legendItem.appendChild(text);
      legend.appendChild(legendItem);
    });

    container.appendChild(legend);
  }

  return container;
}

/**
 * Format value based on format type
 */
function formatValue(value, format) {
  if (value === null || value === undefined) return '--';

  switch (format) {
    case 'currency':
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);

    case 'percent':
      return `${value}%`;

    case 'number':
      return new Intl.NumberFormat('en-US').format(value);

    case 'decimal':
      return new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(value);

    default:
      if (typeof value === 'number') {
        return new Intl.NumberFormat('en-US').format(value);
      }
      return String(value);
  }
}

/**
 * Adjust color brightness
 */
function adjustColor(color, percent) {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = ((num >> 8) & 0x00ff) + amt;
  const B = (num & 0x0000ff) + amt;
  return `#${(
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  )
    .toString(16)
    .slice(1)}`;
}

/**
 * Format label
 */
function formatLabel(key) {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
}

/**
 * Generate plain text
 */
function toPlainText(data) {
  const lines = [];

  if (data.title) {
    lines.push(data.title.toUpperCase());
    lines.push('='.repeat(data.title.length));
    lines.push('');
  }

  if (data.result) {
    if (data.result.label) lines.push(data.result.label);
    lines.push(`>>> ${formatValue(data.result.value, data.result.format)} ${data.result.unit || ''}`);
    if (data.result.description) lines.push(data.result.description);
    lines.push('');
  }

  if (data.inputs) {
    lines.push('INPUTS');
    lines.push('-'.repeat(20));
    Object.entries(data.inputs).forEach(([k, v]) => {
      const val = typeof v === 'object' ? v.display || v.value : v;
      lines.push(`  ${formatLabel(k)}: ${val}`);
    });
    lines.push('');
  }

  if (data.breakdown) {
    lines.push('BREAKDOWN');
    lines.push('-'.repeat(20));
    data.breakdown.forEach((item) => {
      lines.push(`  ${item.label}: ${formatValue(item.value, item.format)}`);
      if (item.description) lines.push(`    ${item.description}`);
    });
    lines.push('');
  }

  if (data.recommendations) {
    lines.push('RECOMMENDATIONS');
    lines.push('-'.repeat(20));
    data.recommendations.forEach((rec, i) => {
      lines.push(`  ${i + 1}. ${rec}`);
    });
  }

  return lines.join('\n');
}

/**
 * Generate HTML
 */
function toHTML(data) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title || 'Calculator Results'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 40px;
      color: #1f2937;
      line-height: 1.6;
    }
    h1 { text-align: center; margin-bottom: 32px; }
    .result-card {
      background: linear-gradient(135deg, #6366f1, #4f46e5);
      color: #fff;
      text-align: center;
      padding: 32px;
      border-radius: 16px;
      margin-bottom: 24px;
    }
    .result-value { font-size: 48px; font-weight: bold; }
    .result-label { font-size: 14px; opacity: 0.9; text-transform: uppercase; }
    .card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }
    .card h3 { margin: 0 0 16px 0; font-size: 16px; }
    .input-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 12px;
    }
    .input-box {
      background: #fff;
      padding: 12px;
      border-radius: 8px;
      text-align: center;
    }
    .input-label { font-size: 11px; color: #6b7280; text-transform: uppercase; }
    .input-value { font-size: 18px; font-weight: 600; }
    .breakdown-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .breakdown-row:last-child { border-bottom: none; }
    .rec-item {
      display: flex;
      gap: 12px;
      padding: 12px;
      background: #fff;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .rec-num {
      width: 24px;
      height: 24px;
      background: #059669;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  ${data.title ? `<h1>${data.title}</h1>` : ''}

  ${data.result ? `
  <div class="result-card">
    ${data.result.label ? `<div class="result-label">${data.result.label}</div>` : ''}
    <div class="result-value">${formatValue(data.result.value, data.result.format)}</div>
    ${data.result.unit ? `<div style="font-size:14px;opacity:0.8;">${data.result.unit}</div>` : ''}
  </div>
  ` : ''}

  ${data.inputs ? `
  <div class="card">
    <h3>Your Inputs</h3>
    <div class="input-grid">
      ${Object.entries(data.inputs).map(([k, v]) => `
        <div class="input-box">
          <div class="input-label">${formatLabel(k)}</div>
          <div class="input-value">${typeof v === 'object' ? v.display || v.value : v}</div>
        </div>
      `).join('')}
    </div>
  </div>
  ` : ''}

  ${data.breakdown ? `
  <div class="card">
    <h3>Breakdown</h3>
    ${data.breakdown.map((item) => `
      <div class="breakdown-row">
        <div>
          <div style="font-weight:500;">${item.label}</div>
          ${item.description ? `<div style="font-size:12px;color:#6b7280;">${item.description}</div>` : ''}
        </div>
        <div style="font-weight:600;font-family:monospace;">${formatValue(item.value, item.format)}</div>
      </div>
    `).join('')}
  </div>
  ` : ''}

  ${data.recommendations ? `
  <div class="card" style="border-top:4px solid #059669;">
    <h3>Recommendations</h3>
    ${data.recommendations.map((rec, i) => `
      <div class="rec-item">
        <span class="rec-num">${i + 1}</span>
        <span>${rec}</span>
      </div>
    `).join('')}
  </div>
  ` : ''}
</body>
</html>
  `.trim();
}

// Register the calculator renderer
registerRenderer('calculator', {
  render: renderCalculator,
  toPlainText,
  toHTML,
});

export { renderCalculator, toPlainText, toHTML };
