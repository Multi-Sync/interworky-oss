// src/assistant/modes/flowEngine/renderers/cardRenderer.js
/**
 * Card Renderer
 * Simple card-based output for displaying key-value information,
 * contact details, booking confirmations, etc.
 *
 * Expects data with simple key-value pairs or structured cards:
 * {
 *   cards: [
 *     { title: string, icon: string, fields: { key: value } }
 *   ]
 * }
 *
 * Or flat data from tool calls that gets auto-organized into cards.
 */

import { createElement } from '../../../ui/baseMethods';
import { registerRenderer, getTheme, createThemedCard } from './index';

/**
 * Render cards from flow data
 */
function renderCards(data, config) {
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
    { id: 'card-content' }
  );

  // If explicit cards are provided
  if (data.cards && Array.isArray(data.cards)) {
    data.cards.forEach((cardData) => {
      const card = renderCard(cardData, theme);
      container.appendChild(card);
    });
    return container;
  }

  // Auto-generate cards from tool call data
  const toolData = Object.entries(data).filter(
    ([key]) => !['cards', 'title', '_completion'].includes(key)
  );

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

  // Create a card for each tool's data
  toolData.forEach(([toolName, toolData]) => {
    const items = Array.isArray(toolData) ? toolData : [toolData];

    items.forEach((item, index) => {
      if (!item || typeof item !== 'object') return;

      const cardTitle = items.length > 1
        ? `${formatLabel(toolName)} ${index + 1}`
        : formatLabel(toolName);

      const card = createThemedCard(cardTitle, theme);

      // Render fields
      const fieldGrid = createElement(
        'div',
        {
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: `${theme.spacing.sm} ${theme.spacing.md}`,
          alignItems: 'baseline',
        },
        {}
      );

      Object.entries(item).forEach(([key, value]) => {
        if (value === null || value === undefined) return;

        const label = createElement(
          'span',
          {
            fontSize: '13px',
            fontWeight: '600',
            color: theme.colors.textMuted,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          },
          { textContent: formatLabel(key) }
        );

        const valueEl = createElement(
          'span',
          {
            fontSize: '15px',
            color: theme.colors.text,
            wordBreak: 'break-word',
          },
          {}
        );

        // Format value based on type
        if (typeof value === 'boolean') {
          valueEl.textContent = value ? 'Yes' : 'No';
          valueEl.style.color = value ? theme.colors.success : theme.colors.textMuted;
        } else if (Array.isArray(value)) {
          valueEl.textContent = value.join(', ');
        } else if (typeof value === 'object') {
          valueEl.textContent = JSON.stringify(value);
          valueEl.style.fontFamily = theme.fonts.mono;
          valueEl.style.fontSize = '12px';
        } else {
          valueEl.textContent = String(value);
        }

        fieldGrid.appendChild(label);
        fieldGrid.appendChild(valueEl);
      });

      card.appendChild(fieldGrid);
      container.appendChild(card);
    });
  });

  // Completion data if present
  if (data._completion) {
    const completionCard = createThemedCard('Results', theme, theme.colors.success);

    if (typeof data._completion === 'object') {
      const fieldGrid = createElement(
        'div',
        {
          display: 'grid',
          gridTemplateColumns: 'auto 1fr',
          gap: `${theme.spacing.sm} ${theme.spacing.md}`,
        },
        {}
      );

      Object.entries(data._completion).forEach(([key, value]) => {
        const label = createElement(
          'span',
          {
            fontSize: '13px',
            fontWeight: '600',
            color: theme.colors.textMuted,
          },
          { textContent: formatLabel(key) }
        );

        const valueEl = createElement(
          'span',
          {
            fontSize: '15px',
            color: theme.colors.text,
          },
          { textContent: typeof value === 'object' ? JSON.stringify(value) : String(value) }
        );

        fieldGrid.appendChild(label);
        fieldGrid.appendChild(valueEl);
      });

      completionCard.appendChild(fieldGrid);
    } else {
      const text = createElement(
        'p',
        { color: theme.colors.text, margin: '0' },
        { textContent: String(data._completion) }
      );
      completionCard.appendChild(text);
    }

    container.appendChild(completionCard);
  }

  return container;
}

/**
 * Render a single card from explicit card data
 */
function renderCard(cardData, theme) {
  const card = createThemedCard(cardData.title, theme, cardData.color);

  if (cardData.icon) {
    // Add icon to card title if provided
    const titleEl = card.querySelector('h3');
    if (titleEl) {
      titleEl.innerHTML = `${cardData.icon} ${cardData.title}`;
    }
  }

  if (cardData.description) {
    const desc = createElement(
      'p',
      {
        fontSize: '14px',
        color: theme.colors.textMuted,
        marginBottom: theme.spacing.md,
      },
      { textContent: cardData.description }
    );
    card.appendChild(desc);
  }

  if (cardData.fields) {
    const fieldGrid = createElement(
      'div',
      {
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        gap: `${theme.spacing.sm} ${theme.spacing.md}`,
      },
      {}
    );

    Object.entries(cardData.fields).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      const label = createElement(
        'span',
        {
          fontSize: '13px',
          fontWeight: '600',
          color: theme.colors.textMuted,
        },
        { textContent: formatLabel(key) }
      );

      const valueEl = createElement(
        'span',
        {
          fontSize: '15px',
          color: theme.colors.text,
        },
        { textContent: typeof value === 'object' ? JSON.stringify(value) : String(value) }
      );

      fieldGrid.appendChild(label);
      fieldGrid.appendChild(valueEl);
    });

    card.appendChild(fieldGrid);
  }

  if (cardData.items && Array.isArray(cardData.items)) {
    const list = createElement(
      'ul',
      {
        margin: '0',
        paddingLeft: '20px',
        color: theme.colors.text,
      },
      {}
    );

    cardData.items.forEach((item) => {
      const li = createElement(
        'li',
        { marginBottom: theme.spacing.xs },
        { textContent: String(item) }
      );
      list.appendChild(li);
    });

    card.appendChild(list);
  }

  return card;
}

/**
 * Format key to label
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

  if (data.cards) {
    data.cards.forEach((card) => {
      if (card.title) {
        lines.push(card.title);
        lines.push('-'.repeat(card.title.length));
      }
      if (card.fields) {
        Object.entries(card.fields).forEach(([k, v]) => {
          lines.push(`  ${formatLabel(k)}: ${v}`);
        });
      }
      if (card.items) {
        card.items.forEach((item) => lines.push(`  • ${item}`));
      }
      lines.push('');
    });
  }

  // Auto-generated from tool data
  const toolData = Object.entries(data).filter(
    ([key]) => !['cards', 'title', '_completion'].includes(key)
  );

  toolData.forEach(([key, value]) => {
    lines.push(formatLabel(key).toUpperCase());
    lines.push('-'.repeat(key.length));

    const items = Array.isArray(value) ? value : [value];
    items.forEach((item) => {
      if (typeof item === 'object') {
        Object.entries(item).forEach(([k, v]) => {
          lines.push(`  ${formatLabel(k)}: ${v}`);
        });
      } else {
        lines.push(`  ${item}`);
      }
    });
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Generate HTML
 */
function toHTML(data) {
  const toolData = Object.entries(data).filter(
    ([key]) => !['cards', 'title', '_completion'].includes(key)
  );

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.title || 'Card Output'}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      color: #1f2937;
      line-height: 1.6;
    }
    h1 {
      text-align: center;
      font-size: 24px;
      margin-bottom: 32px;
    }
    .card {
      background: #f9fafb;
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
      border-top: 4px solid #1f2937;
    }
    .card h3 {
      margin: 0 0 16px 0;
      font-size: 16px;
    }
    .field-grid {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 8px 16px;
    }
    .field-label {
      font-size: 13px;
      font-weight: 600;
      color: #6b7280;
      text-transform: uppercase;
    }
    .field-value {
      font-size: 15px;
      color: #1f2937;
    }
  </style>
</head>
<body>
  ${data.title ? `<h1>${data.title}</h1>` : ''}

  ${data.cards ? data.cards.map((card) => `
  <div class="card">
    ${card.title ? `<h3>${card.icon || ''} ${card.title}</h3>` : ''}
    ${card.description ? `<p style="color:#6b7280;margin-bottom:16px;">${card.description}</p>` : ''}
    ${card.fields ? `
    <div class="field-grid">
      ${Object.entries(card.fields).map(([k, v]) => `
        <span class="field-label">${formatLabel(k)}</span>
        <span class="field-value">${v}</span>
      `).join('')}
    </div>
    ` : ''}
    ${card.items ? `<ul>${card.items.map((i) => `<li>${i}</li>`).join('')}</ul>` : ''}
  </div>
  `).join('') : ''}

  ${toolData.map(([key, value]) => {
    const items = Array.isArray(value) ? value : [value];
    return items.map((item, idx) => `
    <div class="card">
      <h3>${formatLabel(key)}${items.length > 1 ? ` ${idx + 1}` : ''}</h3>
      ${typeof item === 'object' ? `
      <div class="field-grid">
        ${Object.entries(item).map(([k, v]) => `
          <span class="field-label">${formatLabel(k)}</span>
          <span class="field-value">${v}</span>
        `).join('')}
      </div>
      ` : `<p>${item}</p>`}
    </div>
    `).join('');
  }).join('')}
</body>
</html>
  `.trim();
}

// Register the card renderer
registerRenderer('card', {
  render: renderCards,
  toPlainText,
  toHTML,
});

export { renderCards, toPlainText, toHTML };
