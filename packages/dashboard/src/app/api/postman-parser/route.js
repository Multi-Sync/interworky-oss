import { NextResponse } from 'next/server';

/**
 * Utility: Convert a string to camelCase.
 */
function toCamelCase(str) {
  return str
    .replace(/[^a-zA-Z0-9 ]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word, index) => {
      if (index === 0) return word.toLowerCase();
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join('');
}

/**
 * Process a single Postman request item and convert it to an organization method.
 */
function processRequestItem(item) {
  // Only process if the item has a request property
  if (!item.request) return null;

  const methodName = toCamelCase(item.name || 'unnamed');
  const methodVerb = item.request.method;
  let methodEndpoint = '';

  // Determine the endpoint from the Postman URL object
  if (item.request.url) {
    if (item.request.url.raw) {
      methodEndpoint = item.request.url.raw;
    } else if (item.request.url.path) {
      // If host is provided, use a {{baseUrl}} placeholder
      if (item.request.url.host && item.request.url.host.length > 0) {
        methodEndpoint = `{{baseUrl}}/${item.request.url.path.join('/')}`;
      } else {
        methodEndpoint = `/${item.request.url.path.join('/')}`;
      }
    }
  }

  // Use description (or summary) for method details
  let methodDescription = '';
  if (item.request.description) {
    if (typeof item.request.description === 'string') {
      methodDescription = item.request.description;
    } else if (item.request.description.content) {
      methodDescription = item.request.description.content;
    }
  }
  if (!methodDescription) {
    methodDescription = `Endpoint for ${item.name}`;
  }
  const methodInstruction = `Use this method to ${item.name.toLowerCase()}.`;

  // Build dynamic parameters as an array.
  const dynamic_params = [];

  // Extract path parameters from the endpoint (e.g., {username})
  const pathParamRegex = /{([^}]+)}/g;
  let match;
  while ((match = pathParamRegex.exec(methodEndpoint)) !== null) {
    // If at the beginning and placeholder starts with '{{', ignore it.
    if (match.index === 0 && match[0].startsWith('{{')) {
      continue;
    }
    const paramName = match[1];
    dynamic_params.push({
      field_name: `${paramName}_INPATH`,
      field_type: 'string',
      field_required: true,
      field_description: `The ${paramName} path parameter.`,
    });
  }

  // Also extract colon-prefixed parameters from the endpoint (e.g., /:user-id/email/:user-email)
  const colonParamRegex = /:([a-zA-Z0-9_-]+)/g;
  while ((match = colonParamRegex.exec(methodEndpoint)) !== null) {
    const paramName = match[1];
    // Convert dashes to underscores for the field name
    const fieldName = paramName.replace(/-/g, '_') + '_INPATH';
    dynamic_params.push({
      field_name: fieldName,
      field_type: 'string',
      field_required: true,
      field_description: `The ${paramName} path parameter.`,
    });
  }

  // Add IW_TOKEN for authentication only if the request requires Bearer token authentication.
  let requiresBearer = false;
  if (item.request.auth && item.request.auth.type === 'bearer') {
    requiresBearer = true;
  } else if (item.request.header && Array.isArray(item.request.header)) {
    const authHeader = item.request.header.find(header => header.key.toLowerCase() === 'authorization');
    if (authHeader && authHeader.value && authHeader.value.toLowerCase().startsWith('bearer ')) {
      requiresBearer = true;
    }
  }
  if (requiresBearer) {
    dynamic_params.push({
      field_name: 'IW_TOKEN',
      field_type: 'string',
      field_required: true,
      field_description: 'JWT token for authentication.',
    });
  }

  // Optionally, extract parameters from the request body (if JSON or form-data)
  if (item.request.body) {
    if (item.request.body.mode === 'raw' && item.request.body.raw) {
      try {
        const bodyObj = JSON.parse(item.request.body.raw);
        for (const key in bodyObj) {
          // Only support values that are string, number, or boolean
          if (['string', 'number', 'boolean'].includes(typeof bodyObj[key])) {
            dynamic_params.push({
              field_name: key,
              field_type: typeof bodyObj[key],
              field_required: true,
              field_description: `The ${key} field from the request body.`,
            });
          }
        }
      } catch (e) {
        // Skip if not valid JSON
      }
    } else if (item.request.body.mode === 'formdata' && item.request.body.formdata) {
      item.request.body.formdata.forEach(param => {
        dynamic_params.push({
          field_name: param.key,
          field_type: 'string',
          field_required: !param.disabled,
          field_description: `The ${param.key} form parameter.`,
        });
      });
    }
  }

  // Placeholder for the API response
  const ret = {
    response: {
      field_type: 'object',
      field_description: 'The API response object.',
    },
  };

  // Return the complete organization method object with extra fields.
  return {
    method_name: methodName,
    method_instruction: methodInstruction,
    method_description: methodDescription,
    method_verb: methodVerb,
    method_endpoint: methodEndpoint,
    dynamic_params,
    return: ret,
    fixed_params: [],
    auth: '',
    public: false,
  };
}

/**
 * Recursively process an array of Postman items (including nested folders) and ignore duplicates.
 */
function processItems(items) {
  let methods = [];
  const seen = new Set();
  items.forEach(item => {
    if (item.item) {
      const childMethods = processItems(item.item);
      childMethods.forEach(m => {
        if (!seen.has(m.method_name)) {
          seen.add(m.method_name);
          methods.push(m);
        }
      });
    } else {
      const method = processRequestItem(item);
      if (method && !seen.has(method.method_name)) {
        seen.add(method.method_name);
        methods.push(method);
      }
    }
  });
  return methods;
}

/**
 * POST handler for /api/postman-parser.
 * Validates the incoming Postman collection and returns organization methods.
 */
export async function POST(request) {
  try {
    const json = await request.json();

    // Basic validation: ensure the collection has 'info' and 'item'
    if (!json.info || !json.item) {
      return NextResponse.json({ error: 'Invalid Postman collection structure.' }, { status: 400 });
    }

    const methods = processItems(json.item);
    return NextResponse.json(methods);
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Error processing file.' }, { status: 500 });
  }
}
