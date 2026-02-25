export const wrapLongStrings = content => {
  if (typeof content !== 'string') return content;

  //handle very long strings without spaces (like tokens)
  if (content.length > 20 && !content.includes(' ')) {
    return (
      <span
        style={{
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          display: 'inline-block',
          maxWidth: '100%',
        }}
      >
        {content}
      </span>
    );
  }

  //normal text with some long words
  return content.split(/(\s+)/).map((part, index) => {
    if (part.trim().length > 30) {
      return (
        <span
          key={index}
          style={{
            wordBreak: 'break-all',
            overflowWrap: 'break-word',
            display: 'inline-block',
            maxWidth: '100%',
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

/**
 * Custom components for rendering Markdown content with specific styling.
 * These components handle text wrapping, code formatting, and overflow management.
 */
export const customMarkdownRenderers = {
  p: ({ children }) => (
    <p
      style={{
        maxWidth: '100%',
        overflowWrap: 'break-word',
        wordBreak: 'break-word',
        overflowX: 'hidden',
      }}
    >
      {children}
    </p>
  ),
  pre: ({ children }) => (
    <pre
      style={{
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
        maxWidth: '100%',
        overflowX: 'hidden',
        backgroundColor: '#f3f4f6',
        padding: '0.5rem',
        borderRadius: '0.25rem',
      }}
    >
      {children}
    </pre>
  ),
  code: ({ inline, children }) =>
    inline ? (
      <code
        style={{
          wordBreak: 'break-all',
          overflowWrap: 'break-word',
          backgroundColor: '#f3f4f6',
          padding: '0 0.25rem',
          borderRadius: '0.25rem',
          display: 'inline-block',
          maxWidth: '100%',
        }}
      >
        {children}
      </code>
    ) : (
      <code
        style={{
          display: 'block',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
          maxWidth: '100%',
          overflowX: 'hidden',
          backgroundColor: '#f3f4f6',
          padding: '0.5rem',
          borderRadius: '0.25rem',
        }}
      >
        {children}
      </code>
    ),
  text: ({ children }) => wrapLongStrings(children),
};
