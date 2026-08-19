import React from "react";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

/**
 * Lightweight, safe Markdown rendering component for comments.
 * Parses bold (**text**), italic (*text*), code (`code` and ```code```), links ([text](url)), and @mentions (@username).
 * Prevents XSS vulnerabilities while ensuring great visual presentation.
 */
export function MarkdownContent({ content, className = "" }: MarkdownContentProps) {
  if (!content) return null;

  // Process code blocks first (```code```)
  const codeBlockRegex = /```([\s\S]*?)```/g;
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push(...parseInlineMarkdown(content.slice(lastIndex, match.index), `text-${lastIndex}`));
    }
    const codeText = match[1] ?? "";
    parts.push(
      <pre
        key={`codeblock-${match.index}`}
        className="my-2 overflow-x-auto rounded-lg bg-slate-900 p-3 font-mono text-xs text-slate-100 shadow-inner"
      >
        <code>{codeText.trim()}</code>
      </pre>,
    );
    lastIndex = codeBlockRegex.lastIndex;
  }

  if (lastIndex < content.length) {
    parts.push(...parseInlineMarkdown(content.slice(lastIndex), `text-${lastIndex}`));
  }

  return <div className={`prose-sm max-w-none break-words ${className}`}>{parts}</div>;
}

function parseInlineMarkdown(text: string, keyPrefix: string): React.ReactNode[] {
  // Split by line breaks
  const lines = text.split("\n");
  return lines.flatMap((line, lineIdx) => {
    const tokens = parseLineTokens(line, `${keyPrefix}-l${lineIdx}`);
    if (lineIdx < lines.length - 1) {
      return [...tokens, <br key={`${keyPrefix}-br-${lineIdx}`} />];
    }
    return tokens;
  });
}

function parseLineTokens(line: string, keyPrefix: string): React.ReactNode[] {
  // Pattern for links [text](url), bold **text**, italic *text*, code `code`, and @mentions @username
  const inlineRegex = /(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(`([^`]+)`)|(@[a-zA-Z0-9._-]+)/g;

  const result: React.ReactNode[] = [];
  let lastIdx = 0;
  let m: RegExpExecArray | null;
  let tokenCount = 0;

  while ((m = inlineRegex.exec(line)) !== null) {
    if (m.index > lastIdx) {
      result.push(line.slice(lastIdx, m.index));
    }

    const key = `${keyPrefix}-${tokenCount++}`;

    if (m[1]) {
      // Link: [text](url)
      const linkText = m[2];
      const linkUrl = m[3];
      result.push(
        <a
          key={key}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-sky-600 underline hover:text-sky-800"
        >
          {linkText}
        </a>,
      );
    } else if (m[4]) {
      // Bold: **text**
      result.push(
        <strong key={key} className="font-bold text-slate-900">
          {m[5]}
        </strong>,
      );
    } else if (m[6]) {
      // Italic: *text*
      result.push(
        <em key={key} className="italic text-slate-800">
          {m[7]}
        </em>,
      );
    } else if (m[8]) {
      // Inline code: `code`
      result.push(
        <code
          key={key}
          className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-slate-800 border border-slate-200"
        >
          {m[9]}
        </code>,
      );
    } else if (m[10]) {
      // Mention: @username
      result.push(
        <span
          key={key}
          className="inline-flex items-center rounded-md bg-indigo-50 px-1.5 py-0.5 text-xs font-bold text-indigo-700 ring-1 ring-indigo-200"
        >
          {m[10]}
        </span>,
      );
    }

    lastIdx = inlineRegex.lastIndex;
  }

  if (lastIdx < line.length) {
    result.push(line.slice(lastIdx));
  }

  return result;
}
