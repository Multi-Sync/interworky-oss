export const parseMarkdownContent = content => {
  return content
    .trim() // Remove leading and trailing whitespace
    .replace(/^"|"$/g, '') // Remove double quotes at the start and end
    .replace(/\\n/g, '\n') // Convert `\n` into actual newlines
    .replace(/\n\s*\n/g, '\n\n'); // Normalize consecutive newlines for better formatting
};
