import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-xl border border-purple-500/30 bg-slate-900/80 shadow-lg shadow-purple-950/20">
              <table className="w-full text-left text-xs border-collapse">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-950/40 text-purple-300 uppercase tracking-wider font-semibold border-b border-purple-500/20">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-slate-800/80">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-purple-500/10 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 font-bold text-purple-300 whitespace-nowrap">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2.5 text-slate-200 whitespace-nowrap">
              {children}
            </td>
          ),
          p: ({ children }) => (
            <p className="mb-2.5 last:mb-0 leading-relaxed text-slate-200">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 mb-3 space-y-1 text-slate-200">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 mb-3 space-y-1 text-slate-200">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="text-slate-200">
              {children}
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-white">
              {children}
            </strong>
          ),
          code: ({ children }) => (
            <code className="px-1.5 py-0.5 rounded bg-purple-950/50 text-purple-300 font-mono text-xs border border-purple-800/40">
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-purple-500 pl-3.5 py-1.5 my-2.5 bg-purple-950/20 text-slate-300 rounded-r-xl italic text-sm">
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
