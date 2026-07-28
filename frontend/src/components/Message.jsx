import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useState } from "react";
import { Copy, Check, User } from "lucide-react";
import { StellarGearIcon } from "./StellarGearLogo.jsx";

export default function Message({ message }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex gap-4 py-5 px-6 animate-fade-in ${isUser ? "justify-end" : ""}`}>
      {!isUser && (
        <div className="shrink-0 mt-0.5">
          <GemAvatar />
        </div>
      )}

      <div className={`flex flex-col gap-1 max-w-[80%] ${isUser ? "items-end" : "items-start"}`}>
        {isUser ? (
          <div className="bg-surface-2 border border-border rounded-2xl rounded-tr-sm px-4 py-3 text-text-primary text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>
        ) : (
          <div className="prose-gem text-text-primary text-sm leading-7 w-full">
            {message.content ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  code({ node, inline, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || "");
                    const code = String(children).replace(/\n$/, "");
                    if (!inline && match) {
                      return <CodeBlock language={match[1]} code={code} />;
                    }
                    return (
                      <code className="bg-surface-2 text-gem-teal px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                        {children}
                      </code>
                    );
                  },
                  table({ children }) {
                    return (
                      <div className="overflow-x-auto my-3">
                        <table className="min-w-full border-collapse text-sm">{children}</table>
                      </div>
                    );
                  },
                  th({ children }) {
                    return <th className="border border-border px-3 py-2 bg-surface-2 text-text-secondary font-medium text-left">{children}</th>;
                  },
                  td({ children }) {
                    return <td className="border border-border px-3 py-2 text-text-primary">{children}</td>;
                  },
                  p({ children }) {
                    return <p className="mb-3 last:mb-0">{children}</p>;
                  },
                  ul({ children }) {
                    return <ul className="list-disc list-inside mb-3 space-y-1 text-text-primary">{children}</ul>;
                  },
                  ol({ children }) {
                    return <ol className="list-decimal list-inside mb-3 space-y-1 text-text-primary">{children}</ol>;
                  },
                  blockquote({ children }) {
                    return <blockquote className="border-l-2 border-border pl-4 text-text-secondary my-3">{children}</blockquote>;
                  },
                  h1({ children }) { return <h1 className="text-xl font-semibold text-text-primary mb-2 mt-4">{children}</h1>; },
                  h2({ children }) { return <h2 className="text-lg font-semibold text-text-primary mb-2 mt-4">{children}</h2>; },
                  h3({ children }) { return <h3 className="text-base font-semibold text-text-primary mb-1 mt-3">{children}</h3>; },
                  a({ href, children }) {
                    return <a href={href} target="_blank" rel="noopener noreferrer" className="text-gem-blue hover:underline">{children}</a>;
                  },
                }}
              >
                {message.content}
              </ReactMarkdown>
            ) : (
              <TypingDots />
            )}
          </div>
        )}

        {/* Image attachment */}
        {message.metadata?.imageUrl && (
          <div className="mt-2">
            <img
              src={message.metadata.imageUrl}
              alt="Generated"
              className="rounded-xl max-w-sm border border-border"
            />
          </div>
        )}
      </div>

      {isUser && (
        <div className="shrink-0 mt-0.5">
          <div className="w-8 h-8 rounded-full bg-surface-2 border border-border flex items-center justify-center">
            <User size={14} className="text-text-secondary" />
          </div>
        </div>
      )}
    </div>
  );
}

function CodeBlock({ language, code }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="relative group my-3 rounded-xl overflow-hidden border border-border">
      <div className="flex items-center justify-between px-4 py-2 bg-surface-2 border-b border-border">
        <span className="text-xs text-text-disabled font-mono">{language}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1.5 text-xs text-text-disabled hover:text-text-primary transition-colors"
        >
          {copied ? <Check size={13} className="text-green-400" /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={oneDark}
        customStyle={{ margin: 0, background: "#131314", fontSize: "13px", padding: "16px" }}
        showLineNumbers={code.split("\n").length > 5}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

function GemAvatar() {
  return (
    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br from-gem-blue/20 to-gem-purple/20 border border-border">
      <StellarGearIcon size={18} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 py-2">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-2 h-2 rounded-full bg-text-secondary animate-pulse-dot"
          style={{ animationDelay: `${i * 0.2}s` }}
        />
      ))}
    </div>
  );
}
