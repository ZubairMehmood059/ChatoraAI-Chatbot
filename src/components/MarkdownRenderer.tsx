import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';

interface MarkdownRendererProps {
  content: string;
}

// Tokenizer & syntax highlighter for code blocks
function highlightCode(rawCode: string, lang: string): React.ReactNode[] {
  const lines = rawCode.split('\n');

  return lines.map((line, lineIdx) => {
    // Basic regex-based token matching for Python, JS, TS, HTML, CSS, SQL, JSON
    const tokens: React.ReactNode[] = [];
    let remaining = line;
    let keyIdx = 0;

    // Regexes for syntax highlighting
    const regex =
      /(\/\/[^\n]*|#[^\n]*)|("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`)|(\b(?:function|def|class|return|if|else|elif|for|while|import|from|export|default|const|let|var|switch|case|try|catch|finally|async|await|select|from|where|insert|delete|update|table)\b)|(\b(?:true|false|null|undefined|None|True|False|self|this)\b)|(\b\d+(?:\.\d+)?\b)|(\b[a-zA-Z_]\w*(?=\()|\bconsole\b|\bprint\b)|([{}()[\],;:.])/g;

    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        tokens.push(
          <span key={`text-${lineIdx}-${keyIdx++}`}>
            {line.substring(lastIndex, match.index)}
          </span>
        );
      }

      const [full, comment, stringLit, keyword, builtin, number, func, punct] = match;

      if (comment) {
        tokens.push(
          <span key={`comment-${lineIdx}-${keyIdx++}`} style={{ color: 'var(--syn-comment)', fontStyle: 'italic' }}>
            {comment}
          </span>
        );
      } else if (stringLit) {
        tokens.push(
          <span key={`str-${lineIdx}-${keyIdx++}`} style={{ color: 'var(--syn-string)' }}>
            {stringLit}
          </span>
        );
      } else if (keyword) {
        tokens.push(
          <span key={`kw-${lineIdx}-${keyIdx++}`} style={{ color: 'var(--syn-keyword)', fontWeight: 600 }}>
            {keyword}
          </span>
        );
      } else if (builtin) {
        tokens.push(
          <span key={`bi-${lineIdx}-${keyIdx++}`} style={{ color: 'var(--syn-builtin)' }}>
            {builtin}
          </span>
        );
      } else if (number) {
        tokens.push(
          <span key={`num-${lineIdx}-${keyIdx++}`} style={{ color: 'var(--syn-number)' }}>
            {number}
          </span>
        );
      } else if (func) {
        tokens.push(
          <span key={`fn-${lineIdx}-${keyIdx++}`} style={{ color: 'var(--syn-function)' }}>
            {func}
          </span>
        );
      } else if (punct) {
        tokens.push(
          <span key={`punct-${lineIdx}-${keyIdx++}`} style={{ color: 'var(--syn-punct)' }}>
            {punct}
          </span>
        );
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      tokens.push(
        <span key={`end-${lineIdx}-${keyIdx++}`}>
          {line.substring(lastIndex)}
        </span>
      );
    }

    return (
      <div key={`line-${lineIdx}`} className="leading-relaxed">
        {tokens.length > 0 ? tokens : <span>&nbsp;</span>}
      </div>
    );
  });
}

const CodeBlock: React.FC<{ code: string; language: string }> = ({ code, language }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="my-4 rounded-xl overflow-hidden border max-w-full"
      style={{
        backgroundColor: 'var(--code-bg)',
        borderColor: 'var(--code-border)',
        color: 'var(--code-text)',
      }}
    >
      <div
        className="flex justify-between items-center px-4 py-2 text-xs border-b"
        style={{
          borderColor: 'var(--code-border)',
          color: 'var(--code-label)',
        }}
      >
        <span className="font-mono lowercase">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs transition-colors"
          style={{
            color: copied ? 'var(--on-primary)' : 'var(--code-label)',
            backgroundColor: copied ? 'var(--primary)' : 'transparent',
          }}
          title={copied ? 'Copied to clipboard' : 'Copy code'}
          aria-label="Copy code"
        >
          {copied ? <Check size={13} /> : <Copy size={13} />}
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre
        tabIndex={0}
        className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed"
        style={{ color: 'var(--code-text)' }}
      >
        <code>{highlightCode(code, language)}</code>
      </pre>
    </div>
  );
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  // Parse markdown blocks: code blocks, tables, lists, headers, paragraphs
  const blocks = React.useMemo(() => {
    const rawBlocks: Array<
      | { type: 'code'; language: string; content: string }
      | { type: 'table'; headers: string[]; rows: string[][] }
      | { type: 'html'; content: string }
    > = [];

    const lines = content.split('\n');
    let inCode = false;
    let codeLang = '';
    let codeBuffer: string[] = [];
    let textBuffer: string[] = [];

    const flushText = () => {
      if (textBuffer.length > 0) {
        rawBlocks.push({ type: 'html', content: textBuffer.join('\n') });
        textBuffer = [];
      }
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.startsWith('```')) {
        if (!inCode) {
          flushText();
          inCode = true;
          codeLang = line.replace('```', '').trim();
          codeBuffer = [];
        } else {
          inCode = false;
          rawBlocks.push({
            type: 'code',
            language: codeLang,
            content: codeBuffer.join('\n'),
          });
          codeBuffer = [];
        }
        continue;
      }

      if (inCode) {
        codeBuffer.push(line);
      } else {
        textBuffer.push(line);
      }
    }

    if (inCode) {
      rawBlocks.push({
        type: 'code',
        language: codeLang,
        content: codeBuffer.join('\n'),
      });
    } else {
      flushText();
    }

    return rawBlocks;
  }, [content]);

  return (
    <div className="markdown-body space-y-3 text-[15px] sm:text-[16px] leading-[1.65]">
      {blocks.map((block, idx) => {
        if (block.type === 'code') {
          return <CodeBlock key={`code-${idx}`} code={block.content} language={block.language} />;
        }

        if (block.type === 'html') {
          return (
            <div key={`text-${idx}`} className="space-y-3">
              {renderFormattedText(block.content)}
            </div>
          );
        }

        return null;
      })}
    </div>
  );
};

function renderFormattedText(text: string): React.ReactNode {
  const paragraphs = text.split(/\n\n+/);

  return paragraphs.map((para, pIdx) => {
    const trimmed = para.trim();
    if (!trimmed) return null;

    // Header 1 (# ...)
    if (trimmed.startsWith('# ')) {
      return (
        <h1 key={`h1-${pIdx}`} className="text-2xl font-bold tracking-tight mt-5 mb-2" style={{ color: 'var(--text)' }}>
          {formatInline(trimmed.replace(/^#\s+/, ''))}
        </h1>
      );
    }

    // Header 2 (## ...)
    if (trimmed.startsWith('## ')) {
      return (
        <h2 key={`h2-${pIdx}`} className="text-xl font-semibold tracking-tight mt-4 mb-2" style={{ color: 'var(--text)' }}>
          {formatInline(trimmed.replace(/^##\s+/, ''))}
        </h2>
      );
    }

    // Header 3 (### ...)
    if (trimmed.startsWith('### ')) {
      return (
        <h3 key={`h3-${pIdx}`} className="text-lg font-semibold mt-3 mb-1" style={{ color: 'var(--text)' }}>
          {formatInline(trimmed.replace(/^###\s+/, ''))}
        </h3>
      );
    }

    // Blockquote or Callout (> ...)
    if (trimmed.startsWith('>')) {
      const quoteText = trimmed.split('\n').map(l => l.replace(/^>\s?/, '')).join(' ');
      const isImportant = /\[!(NOTE|IMPORTANT|TIP|WARNING)\]/i.test(quoteText) || /^(\*\*|Key Takeaway|Important|Note|Warning)/i.test(quoteText);

      return (
        <blockquote
          key={`bq-${pIdx}`}
          className="my-3 pl-4 pr-3 py-2.5 rounded-r-xl border-l-4 text-xs sm:text-sm leading-relaxed"
          style={{
            borderColor: isImportant ? 'var(--amber)' : 'var(--primary)',
            backgroundColor: isImportant ? 'var(--surface-subtle)' : 'var(--user-msg)',
            color: 'var(--text)',
          }}
        >
          {formatInline(quoteText.replace(/^\[!(NOTE|IMPORTANT|TIP|WARNING)\]\s?/i, ''))}
        </blockquote>
      );
    }

    // Bullet List
    if (trimmed.split('\n').every(l => /^\s*[-*]\s+/.test(l))) {
      const items = trimmed.split('\n').map(l => l.replace(/^\s*[-*]\s+/, ''));
      return (
        <ul key={`ul-${pIdx}`} className="list-disc pl-5 space-y-1 my-2">
          {items.map((it, iIdx) => (
            <li key={`li-${iIdx}`}>{formatInline(it)}</li>
          ))}
        </ul>
      );
    }

    // Numbered List
    if (trimmed.split('\n').every(l => /^\s*\d+\.\s+/.test(l))) {
      const items = trimmed.split('\n').map(l => l.replace(/^\s*\d+\.\s+/, ''));
      return (
        <ol key={`ol-${pIdx}`} className="list-decimal pl-5 space-y-1 my-2">
          {items.map((it, iIdx) => (
            <li key={`oli-${iIdx}`}>{formatInline(it)}</li>
          ))}
        </ol>
      );
    }

    // Table
    if (trimmed.includes('|') && trimmed.split('\n').length >= 2) {
      const rows = trimmed
        .split('\n')
        .map(r => r.trim())
        .filter(r => r.startsWith('|') && r.endsWith('|'));

      if (rows.length >= 2) {
        const headerRow = rows[0]
          .slice(1, -1)
          .split('|')
          .map(c => c.trim());
        const bodyRows = rows
          .slice(2)
          .map(r => r.slice(1, -1).split('|').map(c => c.trim()));

        return (
          <div
            key={`table-${pIdx}`}
            className="overflow-x-auto my-3 border rounded-xl"
            style={{ borderColor: 'var(--border)' }}
          >
            <table className="w-full text-left text-sm border-collapse min-w-[380px]">
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-subtle)' }}>
                  {headerRow.map((h, hIdx) => (
                    <th
                      key={`th-${hIdx}`}
                      className="py-2.5 px-3.5 font-semibold border-b"
                      style={{ borderColor: 'var(--border)' }}
                    >
                      {formatInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {bodyRows.map((bRow, bIdx) => (
                  <tr
                    key={`tr-${bIdx}`}
                    className="border-b last:border-b-0"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {bRow.map((cell, cIdx) => (
                      <td key={`cell-${cIdx}`} className="py-2.5 px-3.5">
                        {formatInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
    }

    // Regular Paragraph
    return (
      <p key={`p-${pIdx}`} className="leading-relaxed">
        {formatInline(para)}
      </p>
    );
  });
}

function formatInline(str: string): React.ReactNode {
  // Process bold (**...**), highlight (==...==), inline code (`...`), and links ([...](...))
  const parts: React.ReactNode[] = [];
  const regex = /(\*\*[^*]+\*\*|==[^=]+==|`[^`]+`|\[[^\]]+\]\([^)]+\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let keyIdx = 0;

  while ((match = regex.exec(str)) !== null) {
    if (match.index > lastIndex) {
      parts.push(str.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push(
        <strong key={`bold-${keyIdx++}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('==') && token.endsWith('==')) {
      parts.push(
        <mark
          key={`hl-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded font-medium text-[0.92em]"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            color: 'var(--primary)',
            borderBottom: '2px solid var(--amber)',
          }}
        >
          {token.slice(2, -2)}
        </mark>
      );
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push(
        <code
          key={`code-in-${keyIdx++}`}
          className="px-1.5 py-0.5 rounded text-[0.88em] font-mono border"
          style={{
            backgroundColor: 'var(--surface-subtle)',
            borderColor: 'var(--border)',
            color: 'var(--text)',
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith('[')) {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        parts.push(
          <a
            key={`a-${keyIdx++}`}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:opacity-85"
            style={{ color: 'var(--primary)' }}
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < str.length) {
    parts.push(str.substring(lastIndex));
  }

  return <>{parts}</>;
}
