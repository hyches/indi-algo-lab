import { useEffect, useCallback, useState } from 'react';

export interface Hotkey {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
  category: 'navigation' | 'trading' | 'general';
}

interface HotkeyConfig {
  enabled: boolean;
  hotkeys: Hotkey[];
}

const HOTKEY_STORAGE_KEY = 'trading-hotkeys-enabled';

export const useHotkeys = (hotkeys: Hotkey[]) => {
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem(HOTKEY_STORAGE_KEY);
    return saved !== 'false';
  });

  const toggleHotkeys = useCallback(() => {
    setEnabled(prev => {
      const next = !prev;
      localStorage.setItem(HOTKEY_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger hotkeys when typing in inputs
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const matchedHotkey = hotkeys.find(hotkey => {
        const keyMatch = event.key.toLowerCase() === hotkey.key.toLowerCase();
        const ctrlMatch = hotkey.ctrl ? (event.ctrlKey || event.metaKey) : !(event.ctrlKey || event.metaKey);
        const shiftMatch = hotkey.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = hotkey.alt ? event.altKey : !event.altKey;
        
        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchedHotkey) {
        event.preventDefault();
        matchedHotkey.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hotkeys, enabled]);

  return { enabled, toggleHotkeys };
};

export const formatHotkeyDisplay = (hotkey: Hotkey): string => {
  const parts: string[] = [];
  if (hotkey.ctrl) parts.push('⌘');
  if (hotkey.shift) parts.push('⇧');
  if (hotkey.alt) parts.push('⌥');
  parts.push(hotkey.key.toUpperCase());
  return parts.join('');
};

export const defaultTradingHotkeys = (handlers: {
  onNavigate: (tab: string) => void;
  onQuickBuy?: () => void;
  onQuickSell?: () => void;
  onClosePosition?: () => void;
  onToggleTheme?: () => void;
  onOpenSearch?: () => void;
  onOpenAlerts?: () => void;
}): Hotkey[] => [
  // Navigation
  { key: '1', description: 'Go to Dashboard', action: () => handlers.onNavigate('dashboard'), category: 'navigation' },
  { key: '2', description: 'Go to Charts', action: () => handlers.onNavigate('charts'), category: 'navigation' },
  { key: '3', description: 'Go to Scanner', action: () => handlers.onNavigate('scanner'), category: 'navigation' },
  { key: '4', description: 'Go to Research', action: () => handlers.onNavigate('research'), category: 'navigation' },
  { key: '5', description: 'Go to Options', action: () => handlers.onNavigate('options'), category: 'navigation' },
  { key: '6', description: 'Go to Positions', action: () => handlers.onNavigate('positions'), category: 'navigation' },
  { key: '7', description: 'Go to Journal', action: () => handlers.onNavigate('journal'), category: 'navigation' },
  { key: '8', description: 'Go to Analytics', action: () => handlers.onNavigate('analytics'), category: 'navigation' },
  { key: '9', description: 'Go to Backtest', action: () => handlers.onNavigate('backtest'), category: 'navigation' },
  { key: '0', description: 'Go to ML Signals', action: () => handlers.onNavigate('ml'), category: 'navigation' },
  
  // Trading
  { key: 'b', description: 'Quick Buy', action: () => handlers.onQuickBuy?.(), category: 'trading' },
  { key: 's', description: 'Quick Sell', action: () => handlers.onQuickSell?.(), category: 'trading' },
  { key: 'x', description: 'Close Position', action: () => handlers.onClosePosition?.(), category: 'trading' },
  { key: 'Escape', description: 'Cancel/Close', action: () => {}, category: 'trading' },
  
  // General
  { key: 'k', ctrl: true, description: 'Open Search', action: () => handlers.onOpenSearch?.(), category: 'general' },
  { key: 'a', ctrl: true, description: 'Open Alerts', action: () => handlers.onOpenAlerts?.(), category: 'general' },
  { key: 't', ctrl: true, description: 'Toggle Theme', action: () => handlers.onToggleTheme?.(), category: 'general' },
  { key: '?', shift: true, description: 'Show Hotkeys', action: () => {}, category: 'general' },
];
