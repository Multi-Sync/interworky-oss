import logger from '../logger';

/**
 * Resource Analyzer
 *
 * Analyzes loaded resources to detect:
 * - Unused resources (loaded but not rendered)
 * - Oversized resources
 * - Inefficient loading patterns
 * - Next.js-specific issues
 */

/**
 * Analyze all loaded resources and detect issues
 */
export function analyzeResources() {
  const issues = [];

  try {
    // Get all resources
    const resources = performance.getEntriesByType('resource');

    // Analyze images
    const imageIssues = analyzeImages(resources);
    issues.push(...imageIssues);

    // Analyze scripts
    const scriptIssues = analyzeScripts(resources);
    issues.push(...scriptIssues);

    // Analyze stylesheets
    const styleIssues = analyzeStylesheets(resources);
    issues.push(...styleIssues);

    // Analyze preloads/prefetches
    const preloadIssues = analyzePreloads();
    issues.push(...preloadIssues);

    // Analyze fonts
    const fontIssues = analyzeFonts(resources);
    issues.push(...fontIssues);

    // Next.js specific checks
    const nextjsIssues = analyzeNextJSPatterns(resources);
    issues.push(...nextjsIssues);

    logger.info('IW_RESOURCE_ANALYZER_001', 'Resource analysis complete', {
      totalIssues: issues.length,
      categories: {
        images: imageIssues.length,
        scripts: scriptIssues.length,
        styles: styleIssues.length,
        preloads: preloadIssues.length,
        fonts: fontIssues.length,
        nextjs: nextjsIssues.length,
      },
    });

    return issues;
  } catch (error) {
    logger.error('IW_RESOURCE_ANALYZER_002', 'Resource analysis failed', {
      error: error.message,
    });
    return [];
  }
}

/**
 * Analyze image resources
 */
function analyzeImages(resources) {
  const issues = [];
  const images = resources.filter(
    (r) =>
      r.initiatorType === 'img' ||
      r.name.match(/\.(jpg|jpeg|png|gif|webp|svg|avif)$/i)
  );

  // Check for images in DOM
  const visibleImages = Array.from(document.images);
  const visibleImageUrls = new Set(
    visibleImages.map((img) => img.currentSrc || img.src)
  );

  images.forEach((resource) => {
    const url = new URL(resource.name);
    const filename = url.pathname.split('/').pop();

    // Check if image is actually visible
    const isVisible =
      visibleImageUrls.has(resource.name) ||
      visibleImages.some((img) =>
        (img.currentSrc || img.src).includes(filename)
      );

    if (!isVisible) {
      issues.push({
        type: 'unused_image',
        severity: 'medium',
        title: 'Image loaded but not displayed',
        description: `"${filename}" was downloaded but is not visible on the page`,
        url: resource.name,
        size: resource.transferSize || 0,
        impact: calculateImpact(resource.transferSize, resource.duration),
        recommendation:
          'Remove preload/prefetch for this image or lazy load it only when needed',
        code: `<!-- Remove or move to specific page -->\n<link rel="preload" href="${url.pathname}" as="image" />`,
      });
    }

    // Check for oversized images
    if (resource.transferSize > 500000) {
      // 500KB
      const sizeInMB = (resource.transferSize / 1024 / 1024).toFixed(2);
      issues.push({
        type: 'oversized_image',
        severity: 'high',
        title: 'Large image file detected',
        description: `"${filename}" is ${sizeInMB}MB - consider compression or WebP/AVIF format`,
        url: resource.name,
        size: resource.transferSize,
        impact: 'high',
        recommendation: `Compress image or convert to WebP/AVIF format. Target size: < 100KB for web images`,
        code: `// Use Next.js Image component for automatic optimization\nimport Image from 'next/image';\n\n<Image src="${url.pathname}" width={800} height={600} alt="..." />`,
      });
    }

    // Check if image should use next/image
    if (!resource.name.includes('/_next/image')) {
      const img = visibleImages.find((i) =>
        (i.currentSrc || i.src).includes(filename)
      );
      if (img && !img.hasAttribute('loading')) {
        issues.push({
          type: 'missing_lazy_load',
          severity: 'low',
          title: 'Image missing lazy loading',
          description: `"${filename}" could benefit from lazy loading`,
          url: resource.name,
          size: resource.transferSize,
          impact: 'medium',
          recommendation:
            'Add loading="lazy" attribute or use Next.js Image component',
          code: `<Image src="${url.pathname}" loading="lazy" alt="..." />`,
        });
      }
    }
  });

  return issues;
}

/**
 * Analyze script resources
 */
function analyzeScripts(resources) {
  const issues = [];
  const scripts = resources.filter(
    (r) => r.initiatorType === 'script' || r.name.match(/\.js$/i)
  );

  scripts.forEach((resource) => {
    const url = new URL(resource.name);
    const filename = url.pathname.split('/').pop();

    // Check for large scripts
    if (resource.transferSize > 200000) {
      // 200KB
      const sizeInKB = (resource.transferSize / 1024).toFixed(2);
      issues.push({
        type: 'large_script',
        severity: 'medium',
        title: 'Large JavaScript bundle detected',
        description: `"${filename}" is ${sizeInKB}KB - consider code splitting`,
        url: resource.name,
        size: resource.transferSize,
        impact: 'high',
        recommendation:
          'Use dynamic imports and code splitting to reduce bundle size',
        code: `// Use dynamic import\nconst Component = dynamic(() => import('./Component'), {\n  loading: () => <LoadingSpinner />,\n});`,
      });
    }

    // Check for slow loading scripts
    if (resource.duration > 1000) {
      issues.push({
        type: 'slow_script',
        severity: 'high',
        title: 'Slow-loading script detected',
        description: `"${filename}" took ${Math.round(resource.duration)}ms to load`,
        url: resource.name,
        duration: resource.duration,
        impact: 'high',
        recommendation:
          'Load non-critical scripts asynchronously or defer them',
        code: `<Script src="${url.pathname}" strategy="lazyOnload" />`,
      });
    }
  });

  return issues;
}

/**
 * Analyze stylesheet resources
 */
function analyzeStylesheets(resources) {
  const issues = [];
  const styles = resources.filter(
    (r) => r.initiatorType === 'css' || r.name.match(/\.css$/i)
  );

  styles.forEach((resource) => {
    const url = new URL(resource.name);
    const filename = url.pathname.split('/').pop();

    // Check for large CSS files
    if (resource.transferSize > 100000) {
      // 100KB
      const sizeInKB = (resource.transferSize / 1024).toFixed(2);
      issues.push({
        type: 'large_css',
        severity: 'medium',
        title: 'Large CSS file detected',
        description: `"${filename}" is ${sizeInKB}KB - consider purging unused CSS`,
        url: resource.name,
        size: resource.transferSize,
        impact: 'medium',
        recommendation:
          'Use CSS modules, purge unused styles, or split CSS by route',
        code: `// Use CSS modules\nimport styles from './Component.module.css';\n\n<div className={styles.container}>...</div>`,
      });
    }
  });

  return issues;
}

/**
 * Analyze preload and prefetch hints
 */
function analyzePreloads() {
  const issues = [];

  // Get all link elements
  const preloads = Array.from(
    document.querySelectorAll('link[rel="preload"], link[rel="prefetch"]')
  );

  preloads.forEach((link) => {
    const href = link.getAttribute('href');
    const rel = link.getAttribute('rel');
    const as = link.getAttribute('as');

    if (!href) return;

    const filename = href.split('/').pop();

    // Check if preloaded resource is actually used
    const isUsed = checkResourceUsage(href, as);

    if (!isUsed && rel === 'preload') {
      issues.push({
        type: 'unused_preload',
        severity: 'high',
        title: `Unused ${as || 'resource'} preload detected`,
        description: `Preloading "${filename}" but it's not used on this page`,
        url: href,
        impact: 'high',
        recommendation: `Remove this preload from the root layout and add it only to pages that need it. This wastes bandwidth and slows down page load.`,
        code: `<!-- Current (wrong - loads on ALL pages) -->\n<!-- In app/layout.js -->\n<link rel="preload" href="${href}" as="${as}" />\n\n<!-- Better approach -->\n<!-- In app/home/page.js (only where needed) -->\n<link rel="preload" href="${href}" as="${as}" />`,
      });
    }

    // Check for excessive preloads
    if (preloads.length > 10 && rel === 'preload') {
      issues.push({
        type: 'excessive_preloads',
        severity: 'medium',
        title: 'Too many preloads',
        description: `Found ${preloads.length} preload hints - this can slow down critical resources`,
        impact: 'medium',
        recommendation:
          'Limit preloads to 3-5 critical resources. Use prefetch for non-critical resources.',
        code: `// Only preload truly critical resources:\n// 1. Above-the-fold images\n// 2. Critical fonts\n// 3. Critical CSS`,
      });
    }
  });

  return issues;
}

/**
 * Check if a preloaded resource is actually used on the page
 */
function checkResourceUsage(href, asType) {
  try {
    switch (asType) {
      case 'image':
        // Check if image is in the DOM
        const images = Array.from(document.images);
        return images.some((img) => {
          const src = img.currentSrc || img.src;
          return src.includes(href) || href.includes(src.split('/').pop());
        });

      case 'font':
        // Check if font is used in computed styles
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
          const fontFamily = window.getComputedStyle(el).fontFamily;
          if (
            fontFamily &&
            fontFamily.includes(href.split('/').pop().split('.')[0])
          ) {
            return true;
          }
        }
        return false;

      case 'script':
        // Check if script is loaded
        const scripts = Array.from(document.scripts);
        return scripts.some((s) => s.src.includes(href));

      case 'style':
        // Check if stylesheet is loaded
        const styles = Array.from(document.styleSheets);
        return styles.some((s) => s.href && s.href.includes(href));

      default:
        // For other types, check in performance entries
        const resources = performance.getEntriesByType('resource');
        return resources.some((r) => r.name.includes(href));
    }
  } catch (error) {
    return true; // Assume used if we can't determine
  }
}

/**
 * Analyze font resources
 */
function analyzeFonts(resources) {
  const issues = [];
  const fonts = resources.filter((r) =>
    r.name.match(/\.(woff|woff2|ttf|otf|eot)$/i)
  );

  fonts.forEach((resource) => {
    const url = new URL(resource.name);
    const filename = url.pathname.split('/').pop();

    // Check for non-woff2 fonts
    if (!filename.endsWith('.woff2')) {
      issues.push({
        type: 'suboptimal_font_format',
        severity: 'low',
        title: 'Non-optimal font format',
        description: `"${filename}" should be in WOFF2 format for better compression`,
        url: resource.name,
        size: resource.transferSize,
        impact: 'low',
        recommendation:
          'Convert fonts to WOFF2 format for better compression (up to 30% smaller)',
        code: `// Use font-display: swap for better UX\n@font-face {\n  font-family: 'MyFont';\n  src: url('/fonts/myfont.woff2') format('woff2');\n  font-display: swap;\n}`,
      });
    }

    // Check if font is preloaded
    const isPreloaded = Array.from(
      document.querySelectorAll('link[rel="preload"]')
    ).some((link) => link.href.includes(filename));

    if (!isPreloaded && resource.duration > 500) {
      issues.push({
        type: 'missing_font_preload',
        severity: 'medium',
        title: 'Font not preloaded',
        description: `"${filename}" took ${Math.round(resource.duration)}ms to load - consider preloading`,
        url: resource.name,
        duration: resource.duration,
        impact: 'medium',
        recommendation: 'Preload critical fonts to prevent layout shift',
        code: `<link rel="preload" href="${url.pathname}" as="font" type="font/woff2" crossOrigin="anonymous" />`,
      });
    }
  });

  return issues;
}

/**
 * Analyze Next.js-specific patterns
 */
function analyzeNextJSPatterns(resources) {
  const issues = [];

  // Check for unoptimized images (not using next/image)
  const images = Array.from(document.images);
  const unoptimizedImages = images.filter((img) => {
    const src = img.currentSrc || img.src;
    return !src.includes('/_next/image') && !img.hasAttribute('data-nimg');
  });

  if (unoptimizedImages.length > 0) {
    unoptimizedImages.forEach((img) => {
      const src = img.currentSrc || img.src;
      const filename = src.split('/').pop();

      issues.push({
        type: 'nextjs_image_optimization',
        severity: 'medium',
        title: 'Image not using Next.js optimization',
        description: `"${filename}" is not using next/image - missing automatic optimization`,
        url: src,
        impact: 'medium',
        recommendation:
          'Use Next.js Image component for automatic optimization, lazy loading, and responsive images',
        code: `import Image from 'next/image';\n\n// Before\n<img src="${src}" alt="..." />\n\n// After\n<Image src="${src}" width={800} height={600} alt="..." />`,
      });
    });
  }

  // Check for missing font optimization
  const fontLinks = Array.from(
    document.querySelectorAll('link[href*="fonts.googleapis.com"]')
  );
  if (fontLinks.length > 0) {
    issues.push({
      type: 'nextjs_font_optimization',
      severity: 'low',
      title: 'Google Fonts not optimized',
      description:
        'Using Google Fonts link - Next.js can optimize this automatically',
      impact: 'low',
      recommendation:
        'Use next/font/google for automatic font optimization and self-hosting',
      code: `// Instead of <link> tag, use:\nimport { Inter } from 'next/font/google';\n\nconst inter = Inter({ subsets: ['latin'] });\n\n// In your component:\n<body className={inter.className}>...</body>`,
    });
  }

  // Check for client-side fetching that could be Server Components
  const fetchCalls = performance
    .getEntriesByType('resource')
    .filter((r) => r.initiatorType === 'fetch' && r.name.includes('/api/'));

  if (fetchCalls.length > 5) {
    issues.push({
      type: 'nextjs_server_components',
      severity: 'medium',
      title: 'Multiple client-side API calls detected',
      description: `${fetchCalls.length} API calls from client - consider Server Components`,
      impact: 'medium',
      recommendation:
        'Use Server Components to fetch data on the server and reduce client-side requests',
      code: `// In Server Component (app directory):\nexport default async function Page() {\n  const data = await fetch('https://api.example.com/data');\n  return <div>{JSON.stringify(data)}</div>;\n}`,
    });
  }

  return issues;
}

/**
 * Calculate performance impact
 */
function calculateImpact(size, duration) {
  if (!size && !duration) return 'low';

  const sizeScore = size > 500000 ? 3 : size > 200000 ? 2 : 1;
  const durationScore = duration > 1000 ? 3 : duration > 500 ? 2 : 1;

  const totalScore = sizeScore + durationScore;

  if (totalScore >= 5) return 'high';
  if (totalScore >= 3) return 'medium';
  return 'low';
}

/**
 * Get summary of issues by category
 */
export function getIssueSummary(issues) {
  const summary = {
    total: issues.length,
    byType: {},
    bySeverity: {
      high: 0,
      medium: 0,
      low: 0,
    },
    totalWastedBytes: 0,
    recommendations: [],
  };

  issues.forEach((issue) => {
    // Count by type
    summary.byType[issue.type] = (summary.byType[issue.type] || 0) + 1;

    // Count by severity
    summary.bySeverity[issue.severity]++;

    // Calculate wasted bytes
    if (issue.size) {
      summary.totalWastedBytes += issue.size;
    }
  });

  // Generate top recommendations
  const highSeverityIssues = issues.filter((i) => i.severity === 'high');
  summary.recommendations = highSeverityIssues
    .slice(0, 5)
    .map((i) => i.recommendation);

  return summary;
}
