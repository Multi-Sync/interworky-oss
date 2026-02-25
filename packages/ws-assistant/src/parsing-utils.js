/**
 * Turn a numeric‐keyed params object or an array of field objects
 * into a { fieldName: fieldValue } map.
 */
function normalizeParams(raw) {
  if (Array.isArray(raw)) {
    return raw.reduce((acc, { field_name, field_value }) => {
      acc[field_name] = field_value;
      return acc;
    }, {});
  }

  if (
    raw &&
    typeof raw === "object" &&
    Object.keys(raw).every((k) => /^\d+$/.test(k))
  ) {
    return Object.values(raw).reduce((acc, { field_name, field_value }) => {
      acc[field_name] = field_value;
      return acc;
    }, {});
  }

  // already flat
  return raw;
}

module.exports = {
  normalizeParams,
};
