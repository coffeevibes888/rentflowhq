'use client';

import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

export interface BrowserTab {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  count?: number;
}

interface BrowserTabsProps {
  tabs: BrowserTab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

export function BrowserTabs({ tabs, activeTab, onTabChange, className }: BrowserTabsProps) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [showScrollIndicator, setShowScrollIndicator] = useState({ left: false, right: false });

  // Check scroll position for mobile indicators
  useEffect(() => {
    const checkScroll = () => {
      if (tabsRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current;
        setShowScrollIndicator({
          left: scrollLeft > 0,
          right: scrollLeft < scrollWidth - clientWidth - 5,
        });
      }
    };

    const tabsEl = tabsRef.current;
    if (tabsEl) {
      checkScroll();
      tabsEl.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        tabsEl.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [tabs]);

  // Scroll active tab into view
  useEffect(() => {
    if (tabsRef.current) {
      const activeTabEl = tabsRef.current.querySelector(`[data-tab-id="${activeTab}"]`);
      if (activeTabEl) {
        activeTabEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  return (
    <div className={cn('relative', className)}>
      {/* Left scroll indicator */}
      {showScrollIndicator.left && (
        <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-slate-900/90 to-transparent z-10 pointer-events-none md:hidden" />
      )}

      {/* Tabs container - browser-style bar */}
      <div
        ref={tabsRef}
        className="flex items-end gap-0.5 overflow-x-auto scrollbar-hide pb-0 -mb-px"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              data-tab-id={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                // Base styles - browser tab shape
                'relative flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5',
                'text-xs md:text-sm font-medium whitespace-nowrap',
                'transition-all duration-200 ease-out',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900',
                // Browser tab shape - rounded top corners
                'rounded-t-xl',
                // Active state
                isActive
                  ? 'bg-gradient-to-b from-slate-800 to-slate-900 text-white border-t border-l border-r border-white/20 z-10'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 border-t border-l border-r border-transparent',
                // Bottom border handling for active tab
                isActive && 'after:absolute after:bottom-0 after:left-0 after:right-0 after:h-px after:bg-slate-900'
              )}
            >
              <Icon className={cn(
                'h-3.5 w-3.5 md:h-4 md:w-4 shrink-0',
                isActive ? 'text-violet-400' : 'text-slate-500'
              )} />
              
              {/* Full label on larger screens, short label on mobile */}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel || tab.label}</span>
              
              {/* Count badge */}
              {tab.count !== undefined && tab.count > 0 && (
                <span className={cn(
                  'ml-0.5 md:ml-1 px-1.5 py-0.5 text-[10px] md:text-xs rounded-full',
                  isActive
                    ? 'bg-violet-500/30 text-violet-300'
                    : 'bg-white/10 text-slate-400'
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Right scroll indicator */}
      {showScrollIndicator.right && (
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-slate-900/90 to-transparent z-10 pointer-events-none md:hidden" />
      )}

      {/* Bottom border line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
    </div>
  );
}
