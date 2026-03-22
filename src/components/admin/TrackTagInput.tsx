import { useState, useMemo, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface TrackTagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  allTags: string[];
  labelMap?: Record<string, string>;
}

export default function TrackTagInput({ value, onChange, allTags, labelMap = {} }: TrackTagInputProps) {
  const [input, setInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = useMemo(() => {
    if (!input.trim()) return [];
    const lower = input.toLowerCase();
    return allTags
      .filter(t => t.toLowerCase().includes(lower) && !value.includes(t))
      .slice(0, 8);
  }, [input, allTags, value]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInput("");
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === "Tab") && input.trim()) {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && value.length > 0) {
      removeTag(value[value.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="flex flex-wrap gap-1.5 p-2.5 rounded-xl bg-background border border-foreground/10 focus-within:border-accent/40 transition-colors min-h-[42px]">
        {value.map(tag => (
          <span key={tag} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/15 text-accent text-xs font-sans">
            {labelMap[tag] || tag}
            <button onClick={() => removeTag(tag)} className="hover:text-foreground transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="flex-1 min-w-[120px] bg-transparent text-foreground text-sm font-sans placeholder:text-muted-foreground/40 focus:outline-none"
          placeholder={value.length === 0 ? "Type to add tags..." : "Add more..."}
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-foreground/10 rounded-xl shadow-lg overflow-hidden max-h-[200px] overflow-y-auto">
          {suggestions.map(tag => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="w-full text-left px-3 py-2 text-sm font-sans text-foreground hover:bg-surface-light transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Show all existing tags as quick-select */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {allTags.filter(t => !value.includes(t)).slice(0, 15).map(tag => (
            <button
              key={tag}
              onClick={() => addTag(tag)}
              className="px-2 py-0.5 rounded-md bg-card text-muted-foreground text-[10px] font-sans border border-foreground/5 hover:border-accent/30 hover:text-foreground transition-all"
            >
              + {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
