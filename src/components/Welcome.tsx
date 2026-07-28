import { Sparkles, Globe, Database, ImageIcon, FileText } from 'lucide-react';

const SUGGESTIONS = [
  {
    icon: FileText,
    title: 'Summarize a document',
    prompt: 'Summarize the key points of this document',
    color: 'text-gem-blue',
    bg: 'bg-gem-blue/10',
  },
  {
    icon: Globe,
    title: 'Search the web',
    prompt: 'What are the latest developments in AI this week?',
    color: 'text-gem-purple',
    bg: 'bg-gem-purple/10',
  },
  {
    icon: Database,
    title: 'Analyze enterprise data',
    prompt: 'Show me a summary of the enterprise data views',
    color: 'text-gem-pink',
    bg: 'bg-gem-pink/10',
  },
  {
    icon: ImageIcon,
    title: 'Generate an image',
    prompt: 'A serene mountain landscape at sunset',
    color: 'text-gem-blue',
    bg: 'bg-gem-blue/10',
  },
];

interface WelcomeProps {
  onSuggestion: (prompt: string) => void;
}

export default function Welcome({ onSuggestion }: WelcomeProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4">
      <div className="w-20 h-20 rounded-full stellar-gradient-bg flex items-center justify-center mb-6 shadow-lg shadow-blue-200/40">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h1 className="text-4xl font-semibold stellar-gradient mb-2">Hello there.</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-10 text-lg">How can I help you today?</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-2xl w-full">
        {SUGGESTIONS.map((s, i) => (
          <button
            key={i}
            onClick={() => onSuggestion(s.prompt)}
            className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-gem-darkSurface border border-gem-border dark:border-gem-darkBorder hover:shadow-md hover:border-gem-blue/30 transition text-left group"
          >
            <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center flex-shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.title}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.prompt}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
