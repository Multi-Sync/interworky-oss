const { getAIProvider } = require('@interworky/providers');
const openai = getAIProvider().getClient();

/**
 * Updates the assistant's functions with the provided methods.
 *
 * @async
 * @function updateAssistantFunctions
 * @param {string} assistantId - The unique identifier of the assistant to update.
 * @param {Array<Object>} methods - An array of method objects to map to OpenAI tools.
 * @param {string} methods[].method_name - The name of the method (used as the function name).
 * @param {string} methods[].method_description - A description of what the method does.
 * @param {Array<Object>} [methods[].dynamic_params] - An array of dynamic parameter objects.
 * @param {string} methods[].dynamic_params[].field_name - The name of the parameter.
 * @param {string} methods[].dynamic_params[].field_type - The type of the parameter (e.g., "string", "number").
 * @param {string} methods[].dynamic_params[].field_description - A description of the parameter.
 * @param {boolean} methods[].dynamic_params[].field_required - Whether the parameter is required.
 * @returns {Promise<boolean>} - Returns `true` if the update was successful, or `false` if an error occurred.
 * @throws {Error} - Throws an error if `assistantId` or `methods` are invalid.
 *
 * @example
 * const assistantId = "assistant_123";
 * const methods = [
 *   {
 *     method_name: "get_user_info",
 *     method_description: "Fetches user information by ID.",
 *     dynamic_params: [
 *       {
 *         field_name: "user_id",
 *         field_type: "string",
 *         field_description: "The ID of the user.",
 *         field_required: true,
 *       },
 *     ],
 *   },
 * ];
 *
 * const result = await updateAssistantFunctions(assistantId, methods);
 * console.log(result); // true
 */
const updateAssistantFunctions = async (assistantId, methods) => {
  try {
    // Validate input parameters
    if (!assistantId || !Array.isArray(methods)) {
      throw new Error("Invalid parameters: 'assistantId' and 'methods' are required.");
    }

    // If OpenAI server is not running, return true
    if (!openai) {
      return true;
    }

    // Retrieve the current assistant configuration
    const currentAssistant = await openai.beta.assistants.retrieve(assistantId);
    const existingTools = currentAssistant.tools || [];

    // Filter out tools of type 'function' (these will be replaced)
    const nonFunctionTools = existingTools.filter(tool => tool.type !== 'function');

    // Map the provided organization methods to new OpenAI function tools
    const newFunctionTools = methods.map(method => {
      // Use dynamic_params as an array
      const dynamicParams = method.dynamic_params || [];
      // Reduce the array into an object with properties and required array.
      const paramsObj = dynamicParams.reduce(
        (acc, param) => {
          acc.properties[param.field_name] = {
            type: param.field_type,
            description: param.field_description,
          };
          if (param.field_required) {
            acc.required.push(param.field_name);
          }
          return acc;
        },
        { properties: {}, required: [] },
      );

      return {
        type: 'function',
        function: {
          name: method.method_name,
          description: method.method_description,
          parameters: {
            type: 'object',
            ...paramsObj,
            additionalProperties: false,
          },
          strict: true,
        },
      };
    });

    // Combine non-function tools with the new function tools
    const updatedTools = [...nonFunctionTools, ...newFunctionTools];

    // Update the assistant with the updated tools list
    await openai.beta.assistants.update(assistantId, { tools: updatedTools });

    console.log(`Successfully updated functions for assistant: ${assistantId}`);
    return true;
  } catch (err) {
    console.error(`Error updating assistant functions: ${err.message}`);
    return false;
  }
};

module.exports = {
  updateAssistantFunctions,
};
