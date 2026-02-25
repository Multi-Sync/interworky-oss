// src/assistant/modes/flowEngine/dataMapper.js
/**
 * Data Mapper - Transforms raw tool call data into structured, usable data
 *
 * Raw tool data comes as JSON strings and includes transfer tools.
 * This module:
 * 1. Parses JSON strings into objects
 * 2. Filters out non-data tools (transfers, handoffs)
 * 3. Merges array entries appropriately
 * 4. Applies data mapping from flow config if provided
 */

import { logger } from '../../../utils/logger';

// Tools that don't contain data (just control flow)
const NON_DATA_TOOLS = [
  'transfer_to_',
  'handoff_to_',
  'route_to_',
];

/**
 * Check if a tool name is a non-data tool
 */
function isNonDataTool(toolName) {
  return NON_DATA_TOOLS.some((prefix) => toolName.toLowerCase().startsWith(prefix.toLowerCase()));
}

/**
 * Parse a value that might be a JSON string
 */
function parseValue(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Try to parse as JSON
  try {
    return JSON.parse(value);
  } catch {
    // Not JSON, return as-is
    return value;
  }
}

/**
 * Parse all entries in an array
 */
function parseArrayEntries(entries) {
  if (!Array.isArray(entries)) {
    return [parseValue(entries)];
  }
  return entries.map(parseValue).filter((v) => v && Object.keys(v).length > 0);
}

/**
 * Merge multiple entries of the same tool into a single array
 * Handles deduplication based on key fields
 */
function mergeEntries(entries, toolName) {
  const parsed = parseArrayEntries(entries);

  // For work experience and education, dedupe by company/institution
  if (toolName.includes('work_experience')) {
    return dedupeByField(parsed, ['company', 'title']);
  }
  if (toolName.includes('education')) {
    return dedupeByField(parsed, ['institution', 'degree']);
  }

  return parsed;
}

/**
 * Deduplicate entries based on key fields
 * Keeps the entry with more data (more fields filled)
 */
function dedupeByField(entries, keyFields) {
  const seen = new Map();

  for (const entry of entries) {
    const key = keyFields.map((f) => entry[f] || '').join('|');
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, entry);
    } else {
      // Keep the one with more filled fields
      const existingFieldCount = Object.values(existing).filter(Boolean).length;
      const newFieldCount = Object.values(entry).filter(Boolean).length;
      if (newFieldCount > existingFieldCount) {
        seen.set(key, entry);
      }
    }
  }

  return Array.from(seen.values());
}

/**
 * Map raw flow data to structured data
 *
 * @param {Object} rawData - Raw tool call data from flow
 * @param {Object} dataMapping - Optional mapping config from output_schema
 * @returns {Object} - Cleaned and structured data
 */
export function mapFlowData(rawData, dataMapping = null) {
  if (!rawData || typeof rawData !== 'object') {
    return {};
  }

  logger.debug('DATA_MAPPER_001', 'Mapping flow data', {
    toolCount: Object.keys(rawData).length,
    hasMapping: !!dataMapping,
  });

  // First, parse and filter raw data
  const cleanedData = {};

  for (const [toolName, entries] of Object.entries(rawData)) {
    // Skip non-data tools
    if (isNonDataTool(toolName)) {
      continue;
    }

    // Parse and merge entries
    const mergedEntries = mergeEntries(entries, toolName);

    if (mergedEntries.length > 0) {
      cleanedData[toolName] = mergedEntries;
    }
  }

  // If no mapping config, return cleaned data
  if (!dataMapping) {
    logger.debug('DATA_MAPPER_002', 'No mapping config, returning cleaned data', {
      keys: Object.keys(cleanedData),
    });
    return cleanedData;
  }

  // Apply data mapping
  const mappedData = {};

  for (const [targetKey, mappingConfig] of Object.entries(dataMapping)) {
    const source = mappingConfig.source;
    const sourceData = cleanedData[source];

    if (!sourceData) {
      continue;
    }

    if (mappingConfig.merge === 'single' || mappingConfig.type === 'single') {
      // Take first entry
      mappedData[targetKey] = sourceData[0] || null;
    } else if (mappingConfig.field) {
      // Extract specific field from first entry
      mappedData[targetKey] = sourceData[0]?.[mappingConfig.field] || null;
    } else {
      // Keep as array
      mappedData[targetKey] = sourceData;
    }
  }

  logger.debug('DATA_MAPPER_003', 'Data mapped', {
    inputKeys: Object.keys(cleanedData),
    outputKeys: Object.keys(mappedData),
  });

  return mappedData;
}

/**
 * Get a flat object suitable for renderers
 * Converts mapped data structure to what renderers expect
 */
export function getRendererData(rawData, outputSchema = null) {
  const dataMapping = outputSchema?.dataMapping;
  const mappedData = mapFlowData(rawData, dataMapping);

  // If we used a mapping, restructure for backwards compatibility
  if (dataMapping) {
    // Create a structure that looks like the old tool-based data
    // but with parsed and cleaned values
    const rendererData = {};

    for (const [key, value] of Object.entries(mappedData)) {
      // Find the original tool name from mapping
      const mappingEntry = Object.entries(dataMapping).find(([k]) => k === key);
      if (mappingEntry) {
        const originalTool = mappingEntry[1].source;
        rendererData[originalTool] = Array.isArray(value) ? value : [value];
      } else {
        rendererData[key] = Array.isArray(value) ? value : [value];
      }
    }

    return rendererData;
  }

  // No mapping, just return the cleaned data in renderer-expected format
  return mappedData;
}

export { isNonDataTool, parseValue, parseArrayEntries };
