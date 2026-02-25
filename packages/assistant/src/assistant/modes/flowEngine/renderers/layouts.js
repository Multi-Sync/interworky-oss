// src/assistant/modes/flowEngine/renderers/layouts.js
/**
 * Layout Registry
 *
 * Layouts define how the result UI is structured and positioned.
 * Each layout must follow the Layout Contract.
 *
 * LAYOUT CONTRACT:
 * {
 *   id: string,              // Unique identifier
 *   name: string,            // Display name
 *   description: string,     // What this layout is for
 *   container: {             // Main container styles
 *     position: string,
 *     display: string,
 *     alignItems: string,
 *     justifyContent: string,
 *     padding: string,
 *     ...other CSS properties
 *   },
 *   content: {               // Content wrapper styles
 *     maxWidth: string,
 *     width: string,
 *     ...other CSS properties
 *   },
 *   header: {                // Header section styles
 *     ...CSS properties
 *   },
 *   body: {                  // Body/main content styles
 *     ...CSS properties
 *   },
 *   actions: {               // Action buttons container styles
 *     ...CSS properties
 *   }
 * }
 */

// Layout registry
const layouts = {};

/**
 * Register a layout
 * @param {string} id - Unique layout identifier
 * @param {object} layout - Layout object following the contract
 */
export function registerLayout(id, layout) {
  layouts[id] = layout;
}

/**
 * Get a layout by ID
 * @param {string} id - Layout identifier
 * @returns {object} Layout object or default layout
 */
export function getLayout(id) {
  return layouts[id] || layouts.centered;
}

/**
 * Get all registered layout IDs
 * @returns {string[]} Array of layout IDs
 */
export function getAvailableLayouts() {
  return Object.keys(layouts);
}

// ============================================
// CENTERED LAYOUT - Card centered on screen
// ============================================
registerLayout('centered', {
  id: 'centered',
  name: 'Centered Card',
  description: 'Content in a centered card with max-width',
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
    overflowY: 'auto',
  },
  content: {
    width: '100%',
    maxWidth: '800px',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
  },
  header: {
    padding: '20px 28px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  body: {
    padding: '28px',
    maxHeight: '60vh',
    overflowY: 'auto',
  },
  actions: {
    padding: '20px 28px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

// ============================================
// FULLSCREEN LAYOUT - Takes entire viewport
// ============================================
registerLayout('fullscreen', {
  id: 'fullscreen',
  name: 'Fullscreen',
  description: 'Content takes the full viewport',
  container: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    padding: '24px 40px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    borderBottom: '1px solid',
  },
  body: {
    flex: '1',
    padding: '40px',
    overflowY: 'auto',
  },
  actions: {
    padding: '20px 40px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    borderTop: '1px solid',
  },
});

// ============================================
// SPLIT LAYOUT - Content on left, preview on right
// ============================================
registerLayout('split', {
  id: 'split',
  name: 'Split View',
  description: 'Content split into two columns',
  container: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  body: {
    flex: '1',
    padding: '32px',
    overflowY: 'auto',
  },
  actions: {
    padding: '20px 32px',
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
});

// ============================================
// MODAL LAYOUT - Smaller centered modal
// ============================================
registerLayout('modal', {
  id: 'modal',
  name: 'Modal',
  description: 'Compact modal overlay',
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  content: {
    width: '100%',
    maxWidth: '500px',
    borderRadius: '16px',
    overflow: 'hidden',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  },
  header: {
    padding: '16px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  body: {
    padding: '24px',
    maxHeight: '50vh',
    overflowY: 'auto',
  },
  actions: {
    padding: '16px 24px',
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
});

// ============================================
// SIDEBAR LAYOUT - Content with fixed sidebar
// ============================================
registerLayout('sidebar', {
  id: 'sidebar',
  name: 'Sidebar',
  description: 'Main content with sidebar for actions',
  container: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'grid',
    gridTemplateColumns: '1fr 300px',
  },
  content: {
    width: '100%',
    maxWidth: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto',
  },
  header: {
    padding: '24px 32px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    borderBottom: '1px solid',
  },
  body: {
    flex: '1',
    padding: '32px',
    overflowY: 'auto',
  },
  actions: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    borderLeft: '1px solid',
  },
});

// ============================================
// COMPACT LAYOUT - Minimal padding, dense info
// ============================================
registerLayout('compact', {
  id: 'compact',
  name: 'Compact',
  description: 'Dense layout with minimal spacing',
  container: {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    boxSizing: 'border-box',
    overflowY: 'auto',
  },
  content: {
    width: '100%',
    maxWidth: '600px',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  header: {
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  body: {
    padding: '16px',
    maxHeight: '70vh',
    overflowY: 'auto',
  },
  actions: {
    padding: '12px 16px',
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

export { layouts };
