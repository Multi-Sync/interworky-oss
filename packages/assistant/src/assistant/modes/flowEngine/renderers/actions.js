// src/assistant/modes/flowEngine/renderers/actions.js
/**
 * Download and Export Actions
 * Modular actions that can be configured per flow
 */

import { registerAction, getRenderer } from './index';

/**
 * Download as PDF using browser print
 */
function downloadPDF(data, config, flowConfig) {
  const renderer = getRenderer(config?.output_schema?.type || 'default');
  const html = renderer.toHTML(data);
  const fileName = `${flowConfig?.flow_id || 'document'}.pdf`;

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${fileName}</title>
      <style>
        @media print {
          body { margin: 0; }
          @page { margin: 0.5in; }
        }
      </style>
    </head>
    <body>
      ${html}
      <script>
        window.onload = function() {
          window.print();
          setTimeout(function() { window.close(); }, 500);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

/**
 * Download as DOC (HTML with .doc extension - Word compatible)
 */
function downloadDOC(data, config, flowConfig) {
  const renderer = getRenderer(config?.output_schema?.type || 'default');
  const html = renderer.toHTML(data);
  const fileName = `${flowConfig?.flow_id || 'document'}.doc`;

  const docContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:w="urn:schemas-microsoft-com:office:word"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="UTF-8">
      <!--[if gte mso 9]>
      <xml>
        <w:WordDocument>
          <w:View>Print</w:View>
          <w:Zoom>100</w:Zoom>
        </w:WordDocument>
      </xml>
      <![endif]-->
    </head>
    <body>
      ${html}
    </body>
    </html>
  `;

  const blob = new Blob([docContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download as JSON
 */
function downloadJSON(data, config, flowConfig) {
  const fileName = `${flowConfig?.flow_id || 'data'}.json`;
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download as plain text
 */
function downloadTXT(data, config, flowConfig) {
  const renderer = getRenderer(config?.output_schema?.type || 'default');
  const text = renderer.toPlainText(data);
  const fileName = `${flowConfig?.flow_id || 'document'}.txt`;

  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Copy to clipboard
 */
function copyToClipboard(data, config, flowConfig) {
  const renderer = getRenderer(config?.output_schema?.type || 'default');
  const text = renderer.toPlainText(data);
  return navigator.clipboard.writeText(text);
}

/**
 * Download as HTML
 */
function downloadHTML(data, config, flowConfig) {
  const renderer = getRenderer(config?.output_schema?.type || 'default');
  const html = renderer.toHTML(data);
  const fileName = `${flowConfig?.flow_id || 'document'}.html`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

// Register all actions
registerAction('pdf', {
  label: 'Download PDF',
  icon: '📄',
  color: '#dc2626',
  textColor: '#fff',
  handler: downloadPDF,
});

registerAction('doc', {
  label: 'Download DOC',
  icon: '📝',
  color: '#2563eb',
  textColor: '#fff',
  handler: downloadDOC,
});

registerAction('json', {
  label: 'Download JSON',
  icon: '📥',
  color: '#059669',
  textColor: '#fff',
  handler: downloadJSON,
});

registerAction('txt', {
  label: 'Download TXT',
  icon: '📃',
  color: '#6b7280',
  textColor: '#fff',
  handler: downloadTXT,
});

registerAction('html', {
  label: 'Download HTML',
  icon: '🌐',
  color: '#8b5cf6',
  textColor: '#fff',
  handler: downloadHTML,
});

registerAction('copy', {
  label: 'Copy Text',
  icon: '📋',
  color: '#e5e7eb',
  textColor: '#374151',
  handler: copyToClipboard,
  isAsync: true,
  successLabel: '✓ Copied!',
});

export {
  downloadPDF,
  downloadDOC,
  downloadJSON,
  downloadTXT,
  downloadHTML,
  copyToClipboard,
};
