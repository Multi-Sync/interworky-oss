/**
 * Code Analysis Utilities for Next.js Tools
 * Provides parsers and analyzers for JSX/TSX code
 */

/**
 * Parse JSX/TSX content to find Image components from next/image
 * @param {string} content - File content
 * @returns {Array} Array of image component data
 */
function parseJSXForImages(content) {
  const images = [];

  // Check if file imports next/image
  const hasImageImport = /import\s+.*Image.*from\s+['"]next\/image['"]/.test(
    content,
  );
  if (!hasImageImport) {
    return images;
  }

  // Find all <Image ... /> components (both self-closing and with children)
  const imageRegex = /<Image\s+([^>]*?)(?:\/?>|>[\s\S]*?<\/Image>)/g;
  let match;
  let lineNumber = 1;

  while ((match = imageRegex.exec(content)) !== null) {
    const componentString = match[0];
    const propsString = match[1];

    // Calculate line number
    const contentBeforeMatch = content.substring(0, match.index);
    lineNumber = (contentBeforeMatch.match(/\n/g) || []).length + 1;

    // Extract props
    const props = extractPropsFromString(propsString);

    images.push({
      line: lineNumber,
      componentString,
      props,
      hasAlt: !!props.alt,
      hasWidth: !!props.width,
      hasHeight: !!props.height,
      hasSizes: !!props.sizes,
      hasPriority: !!props.priority,
      hasFill: !!props.fill,
    });
  }

  return images;
}

/**
 * Extract props from a component string
 */
function extractPropsFromString(propsString) {
  const props = {};

  // Extract prop="value" or prop={value}
  const propRegex = /(\w+)=(?:{([^}]*)}|"([^"]*)"|'([^']*)')/g;
  let match;

  while ((match = propRegex.exec(propsString)) !== null) {
    const propName = match[1];
    const propValue = match[2] || match[3] || match[4];
    props[propName] = propValue;
  }

  // Check for boolean props (priority, etc)
  const booleanProps = ["priority", "fill", "unoptimized"];
  booleanProps.forEach((prop) => {
    if (new RegExp(`\\b${prop}\\b`).test(propsString) && !props[prop]) {
      props[prop] = "true";
    }
  });

  return props;
}

/**
 * Analyze images for optimization issues
 */
function analyzeImageOptimization(images, options = {}) {
  const issues = [];

  images.forEach((image, index) => {
    // Critical: Missing alt text (accessibility)
    if (!image.hasAlt) {
      issues.push({
        line: image.line,
        issue: "Missing alt prop (accessibility violation)",
        fix: `alt="Description needed"`,
        severity: "critical",
        category: "accessibility",
      });
    }

    // High: Missing sizes prop (performance)
    if (!image.hasSizes && !image.hasFill) {
      issues.push({
        line: image.line,
        issue: "Missing sizes prop (causes poor performance and layout shift)",
        fix: `sizes="${options.preferredSizes || "100vw"}"`,
        severity: "high",
        category: "performance",
      });
    }

    // High: Missing width/height (unless using fill)
    if (!image.hasFill && (!image.hasWidth || !image.hasHeight)) {
      issues.push({
        line: image.line,
        issue: "Missing width and height props (causes layout shift)",
        fix: "width={800} height={600} // Adjust to actual dimensions",
        severity: "high",
        category: "performance",
      });
    }

    // Medium: Could add priority to first image
    if (index === 0 && !image.hasPriority && options.autoAddPriority) {
      issues.push({
        line: image.line,
        issue:
          "First image could benefit from priority prop (LCP optimization)",
        fix: "priority",
        severity: "medium",
        category: "performance",
      });
    }
  });

  return issues;
}

/**
 * Check if component uses client-side features
 */
function hasClientFeatures(content) {
  const clientFeatures = {
    hooks: [],
    eventHandlers: [],
    browserAPIs: [],
  };

  // Check for React hooks
  const hooks = [
    "useState",
    "useEffect",
    "useContext",
    "useReducer",
    "useCallback",
    "useMemo",
    "useRef",
  ];
  hooks.forEach((hook) => {
    if (new RegExp(`\\b${hook}\\(`).test(content)) {
      clientFeatures.hooks.push(hook);
    }
  });

  // Check for event handlers
  const eventHandlers = [
    "onClick",
    "onChange",
    "onSubmit",
    "onFocus",
    "onBlur",
    "onKeyDown",
  ];
  eventHandlers.forEach((handler) => {
    if (new RegExp(`\\b${handler}=`).test(content)) {
      clientFeatures.eventHandlers.push(handler);
    }
  });

  // Check for browser APIs
  const browserAPIs = [
    "window",
    "document",
    "localStorage",
    "sessionStorage",
    "navigator",
  ];
  browserAPIs.forEach((api) => {
    if (new RegExp(`\\b${api}\\.`).test(content)) {
      clientFeatures.browserAPIs.push(api);
    }
  });

  return clientFeatures;
}

/**
 * Analyze if component can be a Server Component
 */
function canBeServerComponent(content) {
  const hasUseClient = /['"]use client['"]/.test(content);
  const clientFeatures = hasClientFeatures(content);

  const usesClientFeatures =
    clientFeatures.hooks.length > 0 ||
    clientFeatures.eventHandlers.length > 0 ||
    clientFeatures.browserAPIs.length > 0;

  return {
    canConvert: !hasUseClient && !usesClientFeatures,
    hasUseClient,
    clientFeatures,
    recommendation: usesClientFeatures
      ? "Component uses client features - consider splitting"
      : "Component can be converted to Server Component",
  };
}

/**
 * Find unoptimized patterns in Next.js code
 */
function findPerformanceIssues(content, filePath) {
  const issues = [];

  // Check for unoptimized images
  const images = parseJSXForImages(content);
  const imageIssues = analyzeImageOptimization(images);
  issues.push(
    ...imageIssues.map((issue) => ({
      ...issue,
      type: "unoptimized-image",
      file: filePath,
    })),
  );

  // Check for unnecessary "use client"
  const hasUseClient = /['"]use client['"]/.test(content);
  if (hasUseClient) {
    const analysis = canBeServerComponent(content);
    if (analysis.canConvert) {
      issues.push({
        line: 1,
        type: "unnecessary-client-component",
        issue: 'Component has "use client" but uses no client features',
        severity: "medium",
        category: "performance",
        file: filePath,
      });
    }
  }

  // Check for missing Suspense boundaries around async components
  const hasAsyncComponent = /export\s+default\s+async\s+function/.test(content);
  const hasSuspense = /<Suspense/.test(content);
  if (hasAsyncComponent && !hasSuspense) {
    issues.push({
      line: null,
      type: "missing-suspense",
      issue: "Async component should be wrapped in Suspense boundary",
      severity: "medium",
      category: "best-practice",
      file: filePath,
    });
  }

  // Check for missing metadata export
  const isPage = /page\.(js|jsx|ts|tsx)$/.test(filePath);
  const hasMetadata =
    /export\s+(const\s+metadata|async\s+function\s+generateMetadata)/.test(
      content,
    );
  if (isPage && !hasMetadata) {
    issues.push({
      line: null,
      type: "missing-metadata",
      issue: "Page component should export metadata for SEO",
      severity: "medium",
      category: "seo",
      file: filePath,
    });
  }

  return issues;
}

/**
 * Check if file imports from specific package
 */
function hasImport(content, packageName) {
  const importRegex = new RegExp(
    `import\\s+.*from\\s+['"]${packageName.replace(/\//g, "\\/")}['"]`,
  );
  return importRegex.test(content);
}

/**
 * Extract component name from file content
 */
function extractComponentName(content) {
  // Try to find: export default function ComponentName
  const match = content.match(/export\s+default\s+function\s+(\w+)/);
  return match ? match[1] : null;
}

/**
 * Get severity rank for sorting
 */
function getSeverityRank(severity) {
  const ranks = { critical: 4, high: 3, medium: 2, low: 1 };
  return ranks[severity] || 0;
}

/**
 * Get impact description for issue type
 */
function getImpactDescription(type) {
  const impacts = {
    "unoptimized-image": "Poor LCP, potential layout shift",
    "unnecessary-client-component": "Increased client bundle size",
    "missing-suspense": "No loading state for async components",
    "missing-metadata": "Poor SEO and social sharing",
  };
  return impacts[type] || "Performance impact";
}

/**
 * Get action description for issue
 */
function getActionForIssue(issue) {
  const actions = {
    "unoptimized-image": `Add missing props to Image component (line ${issue.line})`,
    "unnecessary-client-component": 'Remove "use client" directive',
    "missing-suspense": "Wrap async component in Suspense boundary",
    "missing-metadata": "Add metadata export for SEO",
  };
  return actions[issue.type] || issue.issue;
}

/**
 * Get estimated gain for fixing issue
 */
function getGainEstimate(issue) {
  const gains = {
    "unoptimized-image": "Improve LCP by 150-300ms",
    "unnecessary-client-component": "Reduce bundle by 20-40KB",
    "missing-suspense": "Better UX with loading state",
    "missing-metadata": "Improved SEO rankings",
  };
  return gains[issue.type] || "Performance improvement";
}

module.exports = {
  parseJSXForImages,
  analyzeImageOptimization,
  hasClientFeatures,
  canBeServerComponent,
  findPerformanceIssues,
  hasImport,
  extractComponentName,
  extractPropsFromString,
  getSeverityRank,
  getImpactDescription,
  getActionForIssue,
  getGainEstimate,
};
