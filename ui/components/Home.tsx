'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import ContributionGraph from './ContributionGraph';
import YearSelector from './YearSelector';
import { Download, RotateCcw, Undo2, Redo2 } from 'lucide-react';

interface ContributionMap {
  [year: string]: {
    [month: string]: {
      [day: string]: number;
    };
  };
}

const STORAGE_KEY = 'commitry-contributions';
const STORAGE_YEAR_KEY = 'commitry-selected-year';
const MAX_HISTORY = 50;

export default function Home() {
  // Store contributions in format: "YYYY-MM-DD" -> count
  const [contributions, setContributions] = useState<Map<string, number>>(new Map());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [history, setHistory] = useState<Map<string, number>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load from localStorage on mount
  useEffect(() => {
    const savedContributions = localStorage.getItem(STORAGE_KEY);
    const savedYear = localStorage.getItem(STORAGE_YEAR_KEY);
    
    if (savedContributions) {
      try {
        const parsed = JSON.parse(savedContributions);
        const map = new Map<string, number>();
        Object.entries(parsed).forEach(([key, value]) => {
          map.set(key, value as number);
        });
        setContributions(map);
        setHistory([map]);
        setHistoryIndex(0);
      } catch (e) {
        console.error('Failed to load contributions from localStorage', e);
      }
    } else {
      // Initialize with empty map
      const emptyMap = new Map<string, number>();
      setHistory([emptyMap]);
      setHistoryIndex(0);
    }
    
    if (savedYear) {
      const year = parseInt(savedYear, 10);
      if (!isNaN(year)) {
        setSelectedYear(year);
      }
    }
  }, []);

  // Debounced save to localStorage
  const saveToLocalStorage = useCallback((contribs: Map<string, number>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      const obj = Object.fromEntries(contribs);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
    }, 500);
  }, []);

  // Save selected year to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_YEAR_KEY, selectedYear.toString());
  }, [selectedYear]);

  const addToHistory = useCallback((newContributions: Map<string, number>) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(new Map(newContributions));
      // Limit history size
      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return newHistory;
      }
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const handleDotClick = useCallback((date: Date, currentCount: number) => {
    const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const newCount = currentCount >= 20 ? 0 : currentCount + 1;
    
    setContributions(prev => {
      const newMap = new Map(prev);
      if (newCount === 0) {
        newMap.delete(dateKey);
      } else {
        newMap.set(dateKey, newCount);
      }
      
      // Add to history
      addToHistory(newMap);
      
      // Save to localStorage (debounced)
      saveToLocalStorage(newMap);
      
      return newMap;
    });
  }, [addToHistory, saveToLocalStorage]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevContributions = history[newIndex];
      setContributions(new Map(prevContributions));
      setHistoryIndex(newIndex);
      saveToLocalStorage(prevContributions);
    }
  }, [history, historyIndex, saveToLocalStorage]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextContributions = history[newIndex];
      setContributions(new Map(nextContributions));
      setHistoryIndex(newIndex);
      saveToLocalStorage(nextContributions);
    }
  }, [history, historyIndex, saveToLocalStorage]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  // Convert contributions map to JSON format
  const contributionsJson = useMemo(() => {
    const json: ContributionMap = {};
    
    contributions.forEach((count, dateKey) => {
      const [year, month, day] = dateKey.split('-');
      
      if (!json[year]) {
        json[year] = {};
      }
      if (!json[year][month]) {
        json[year][month] = {};
      }
      json[year][month][day] = count;
    });
    
    return json;
  }, [contributions]);

  const handleDownload = useCallback(() => {
    const jsonString = JSON.stringify(contributionsJson, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contributions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [contributionsJson]);

  const handleReset = useCallback(() => {
    if (confirm('Are you sure you want to reset all contributions? This cannot be undone.')) {
      const emptyMap = new Map<string, number>();
      setContributions(emptyMap);
      setHistory([emptyMap]);
      setHistoryIndex(0);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="w-full bg-white font-sans dark:bg-black">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-black dark:text-white">
              Contribution graph
            </h2>
            <p className="text-sm text-black dark:text-white mt-1 opacity-70">
              Click on any day to set commit count. Click multiple times to cycle through 0-20 commits.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <YearSelector selectedYear={selectedYear} onYearChange={setSelectedYear} />
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black dark:text-white border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-black dark:disabled:hover:text-white"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
              Undo
            </button>
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black dark:text-white border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-black dark:disabled:hover:text-white"
              title="Redo (Ctrl+Y)"
            >
              <Redo2 className="h-4 w-4" />
              Redo
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-black dark:text-white border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              <Download className="h-4 w-4" />
              Download JSON
            </button>
          </div>
        </div>

        {/* Contribution Graph */}
        <div className="bg-white dark:bg-black rounded-lg border border-black dark:border-white p-6">
          <ContributionGraph contributions={contributions} selectedYear={selectedYear} onDotClick={handleDotClick} />
        </div>
      </div>
    </div>
  );
}
