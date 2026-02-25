exports.generateTemplate = (template, data) => {
  return template.replace(/\[([^\]]+)\]/g, (_, key) => data[key] || '');
};
