# Flow Component Contracts

This document defines the contracts that all modular flow components must follow.
Each component type (Renderer, Theme, Layout, Action) has a specific interface that
allows them to be used interchangeably within the flow system.

## Overview

The modular flow system uses a registry pattern where components are:
1. **Registered** with a unique ID
2. **Referenced** by ID in flow configuration
3. **Retrieved** at runtime using getter functions

## Renderer Contract

Renderers transform flow data into visual output. They are selected by the
`output_schema.type` field in the flow configuration.

### Interface

```javascript
{
  // REQUIRED: Render data to DOM element
  render: (data, config) => HTMLElement,

  // REQUIRED: Convert data to plain text (for copy/export)
  toPlainText: (data) => string,

  // REQUIRED: Convert data to standalone HTML (for export)
  toHTML: (data) => string
}
```

### Parameters

- `data` - The transformed flow data (after DataMapper processing)
  - Contains tool call results keyed by tool name
  - May include `_completion` key with AI analysis results
- `config` - The `output_schema` object from the flow

### Example

```javascript
import { registerRenderer, getTheme } from './index';

registerRenderer('my-renderer', {
  render: (data, config) => {
    const theme = getTheme(config?.theme);
    const container = document.createElement('div');
    // Build UI using theme colors, fonts, etc.
    return container;
  },

  toPlainText: (data) => {
    return `Result: ${data.value}`;
  },

  toHTML: (data) => {
    return `<html><body>${data.value}</body></html>`;
  }
});
```

### Available Renderers

| ID | Description | Use Case |
|----|-------------|----------|
| `default` | JSON display | Debugging, raw data |
| `resume` | Professional resume | Resume builder flows |
| `macro` | Nutrition calculator | Macro/calorie calculators |
| `report` | General report | Reports, summaries |
| `card` | Card-based display | Contact info, bookings |
| `calculator` | Calculator results | Any calculation flow |
| `career` | Career guidance | Career assessment flows |

---

## Theme Contract

Themes define visual styling. They are selected by the `output_schema.theme`
field in the flow configuration.

### Interface

```javascript
{
  id: string,           // Unique identifier
  name: string,         // Display name
  description: string,  // What this theme is for

  colors: {
    primary: string,      // Main brand color (hex)
    secondary: string,    // Secondary accent
    background: string,   // Content background
    surface: string,      // Card/container background
    text: string,         // Primary text color
    textMuted: string,    // Secondary text color
    border: string,       // Border color
    success: string,      // Success state
    error: string         // Error state
  },

  fonts: {
    heading: string,      // Font family for headings
    body: string,         // Font family for body text
    mono: string          // Font family for code/data
  },

  spacing: {
    xs: string,           // Extra small (4px)
    sm: string,           // Small (8px)
    md: string,           // Medium (16px)
    lg: string,           // Large (24px)
    xl: string            // Extra large (32px)
  },

  borderRadius: {
    sm: string,           // Small radius
    md: string,           // Medium radius
    lg: string,           // Large radius
    full: string          // Full/pill radius (9999px)
  },

  shadows: {
    sm: string,           // Subtle shadow
    md: string,           // Medium shadow
    lg: string            // Large shadow
  }
}
```

### Example

```javascript
import { registerTheme } from './themes';

registerTheme('ocean', {
  id: 'ocean',
  name: 'Ocean',
  description: 'Calm blue theme inspired by the sea',

  colors: {
    primary: '#0077b6',
    secondary: '#00b4d8',
    background: '#ffffff',
    surface: '#f0f9ff',
    text: '#023e8a',
    textMuted: '#0096c7',
    border: '#90e0ef',
    success: '#06d6a0',
    error: '#ef476f'
  },

  fonts: {
    heading: "'Lato', sans-serif",
    body: "'Open Sans', sans-serif",
    mono: "monospace"
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px'
  },

  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px'
  },

  shadows: {
    sm: '0 1px 2px rgba(0, 119, 182, 0.1)',
    md: '0 4px 6px rgba(0, 119, 182, 0.15)',
    lg: '0 10px 15px rgba(0, 119, 182, 0.2)'
  }
});
```

### Available Themes

| ID | Description |
|----|-------------|
| `professional` | Clean corporate styling (default) |
| `minimal` | Ultra clean with lots of whitespace |
| `modern` | Contemporary with subtle accents |
| `playful` | Fun and colorful |
| `dark` | Dark mode styling |
| `corporate` | Enterprise-ready professional |

---

## Layout Contract

Layouts define how the result UI is structured and positioned. They are selected
by the `output_schema.layout` field in the flow configuration.

### Interface

```javascript
{
  id: string,             // Unique identifier
  name: string,           // Display name
  description: string,    // What this layout is for

  container: {            // Main container styles
    position: string,
    display: string,
    alignItems: string,
    justifyContent: string,
    padding: string,
    // ...other CSS properties
  },

  content: {              // Content wrapper styles
    maxWidth: string,
    width: string,
    // ...other CSS properties
  },

  header: {               // Header section styles
    padding: string,
    display: string,
    // ...other CSS properties
  },

  body: {                 // Body/main content styles
    padding: string,
    maxHeight: string,
    overflowY: string,
    // ...other CSS properties
  },

  actions: {              // Action buttons container styles
    padding: string,
    display: string,
    gap: string,
    // ...other CSS properties
  }
}
```

### Example

```javascript
import { registerLayout } from './layouts';

registerLayout('narrow', {
  id: 'narrow',
  name: 'Narrow',
  description: 'Narrow centered content for reading',

  container: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    boxSizing: 'border-box',
    overflowY: 'auto'
  },

  content: {
    width: '100%',
    maxWidth: '600px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.1)'
  },

  header: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },

  body: {
    padding: '24px',
    maxHeight: '60vh',
    overflowY: 'auto'
  },

  actions: {
    padding: '16px 24px',
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  }
});
```

### Available Layouts

| ID | Description |
|----|-------------|
| `centered` | Card centered on screen (default) |
| `fullscreen` | Takes entire viewport |
| `split` | Two-column split view |
| `modal` | Smaller centered modal |
| `sidebar` | Main content with sidebar |
| `compact` | Minimal padding, dense |

---

## Action Contract

Actions handle user interactions like downloads, copies, and exports. They are
referenced in the `output_schema.downloadFormats` array.

### Interface

```javascript
{
  // REQUIRED: Execute the action
  execute: (data, config) => Promise<void> | void,

  // REQUIRED: Button label
  label: string,

  // OPTIONAL: Icon (emoji or SVG)
  icon: string
}
```

### Parameters

- `data` - The flow result data
- `config` - The action configuration

### Example

```javascript
import { registerAction } from './actions';

registerAction('share', {
  label: 'Share',
  icon: '🔗',

  execute: async (data, config) => {
    if (navigator.share) {
      await navigator.share({
        title: config.title || 'Flow Result',
        text: data.summary || '',
        url: window.location.href
      });
    }
  }
});
```

### Available Actions

| ID | Description |
|----|-------------|
| `copy` | Copy to clipboard |
| `pdf` | Download as PDF |
| `doc` | Download as Word document |
| `html` | Download as HTML |
| `txt` | Download as plain text |
| `json` | Download as JSON |

---

## Flow Configuration Reference

The `output_schema` in a flow configuration uses these component IDs:

```javascript
{
  "output_schema": {
    // Renderer selection
    "type": "resume",              // Renderer ID

    // Theme selection
    "theme": "professional",       // Theme ID

    // Layout selection
    "layout": "centered",          // Layout ID

    // UI options
    "ui": {
      "animation": "slide-up",     // slide-up | fade-in | zoom | none
      "showTranscript": false,
      "showTimer": true,
      "showAgentName": true
    },

    // Success state customization
    "success_message": "Your Result is Ready!",
    "theme_color": "#10b981",
    "loading_title": "Processing...",
    "loading_subtitle": "Please wait",

    // Available download actions
    "downloadFormats": ["pdf", "doc", "copy"],

    // Data transformation mapping
    "dataMapping": {
      "contact": { "source": "save_contact_info", "merge": "single" },
      "items": { "source": "save_items", "merge": "array" }
    }
  }
}
```

---

## Adding Custom Components

### 1. Create the Component File

```javascript
// src/assistant/modes/flowEngine/renderers/myRenderer.js
import { registerRenderer, getTheme } from './index';

function renderMy(data, config) {
  const theme = getTheme(config?.theme);
  // ... build UI
}

registerRenderer('my-type', {
  render: renderMy,
  toPlainText: (data) => '...',
  toHTML: (data) => '...'
});
```

### 2. Import in Main Index

The component self-registers when imported. Make sure to import it in the
application entry point or renderer index.

### 3. Use in Flow Configuration

```javascript
{
  "output_schema": {
    "type": "my-type",
    "theme": "modern"
  }
}
```

---

## Best Practices

1. **Use Theme Values**: Always use theme colors, fonts, and spacing instead
   of hardcoded values for consistency.

2. **Support All Export Formats**: Implement both `toPlainText` and `toHTML`
   for complete export functionality.

3. **Handle Missing Data**: Check for null/undefined values gracefully.

4. **Keep Renderers Pure**: Renderers should only transform data to UI,
   not modify or fetch data.

5. **Document Data Requirements**: Clearly document what data structure
   your renderer expects.

6. **Test with Multiple Themes**: Ensure your renderer looks good with
   all available themes.
