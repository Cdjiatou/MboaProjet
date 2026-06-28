import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useWordCount } from '@/hooks/useWordCount';

interface Props {
  text: string;
  maxWords?: number;
  previewLines?: number;
}

export const BiographyDisplay = ({ text, maxWords = 300, previewLines = 3 }: Props) => {
  const [expanded, setExpanded] = useState(false);
  const wordCount = useWordCount(text);
  const isLong = text.length > 200 || wordCount > 40;

  return (
    <div>
      <p
        className={`text-neutral-400 leading-relaxed text-sm whitespace-pre-line ${
          !expanded && isLong ? `line-clamp-${previewLines}` : ''
        }`}
        style={!expanded && isLong ? { display: '-webkit-box', WebkitLineClamp: previewLines, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : undefined}
      >
        {text}
      </p>

      <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
        <span className="text-[10px] text-neutral-600 uppercase tracking-wider">
          {wordCount} / {maxWords} mots
        </span>
        {isLong && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-xs text-[#d4af37] hover:text-[#e8c547] font-semibold transition-colors"
          >
            {expanded ? (
              <>Voir moins <ChevronUp className="w-3.5 h-3.5" /></>
            ) : (
              <>Lire la suite <ChevronDown className="w-3.5 h-3.5" /></>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
