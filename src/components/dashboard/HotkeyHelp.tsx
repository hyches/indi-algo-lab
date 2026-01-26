import React from 'react';
import { Keyboard, X } from 'lucide-react';
import { formatHotkeyDisplay, Hotkey } from '@/hooks/useHotkeys';
import { cn } from '@/lib/utils';

interface HotkeyHelpProps {
  hotkeys: Hotkey[];
  isOpen: boolean;
  onClose: () => void;
}

export const HotkeyHelp: React.FC<HotkeyHelpProps> = ({ hotkeys, isOpen, onClose }) => {
  if (!isOpen) return null;

  const categories = {
    navigation: hotkeys.filter(h => h.category === 'navigation'),
    trading: hotkeys.filter(h => h.category === 'trading'),
    general: hotkeys.filter(h => h.category === 'general'),
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative glass-card p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto animate-scale-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-accent transition-colors"
        >
          <X size={18} />
        </button>
        
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Keyboard className="text-primary" size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Keyboard Shortcuts</h2>
            <p className="text-sm text-muted-foreground">Press ? to toggle this help</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Navigation */}
          <div>
            <h3 className="text-sm font-medium text-primary mb-3">Navigation</h3>
            <div className="space-y-2">
              {categories.navigation.map(hotkey => (
                <div key={hotkey.description} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{hotkey.description}</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                    {formatHotkeyDisplay(hotkey)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* Trading */}
          <div>
            <h3 className="text-sm font-medium text-success mb-3">Trading</h3>
            <div className="space-y-2">
              {categories.trading.map(hotkey => (
                <div key={hotkey.description} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{hotkey.description}</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                    {formatHotkeyDisplay(hotkey)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>

          {/* General */}
          <div>
            <h3 className="text-sm font-medium text-warning mb-3">General</h3>
            <div className="space-y-2">
              {categories.general.map(hotkey => (
                <div key={hotkey.description} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{hotkey.description}</span>
                  <kbd className="px-2 py-0.5 rounded bg-muted text-xs font-mono">
                    {formatHotkeyDisplay(hotkey)}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            Tip: Hotkeys are disabled when typing in input fields
          </p>
        </div>
      </div>
    </div>
  );
};
