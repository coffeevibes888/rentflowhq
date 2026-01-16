'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface HeatmapPoint {
  x: number | null;
  y: number | null;
  element: string;
  text: string | null;
}

interface HeatmapViewerProps {
  heatmapData: Record<string, HeatmapPoint[]>;
  pages: string[];
}

export default function HeatmapViewer({ heatmapData, pages }: HeatmapViewerProps) {
  const [selectedPage, setSelectedPage] = useState(pages[0] || '/');
  
  const clicks = heatmapData[selectedPage] || [];
  
  // Group clicks by proximity (within 50px)
  const groupedClicks = clicks.reduce((acc, click) => {
    if (click.x === null || click.y === null) return acc;
    
    const existing = acc.find(
      group => 
        Math.abs(group.x - click.x) < 50 && 
        Math.abs(group.y - click.y) < 50
    );
    
    if (existing) {
      existing.count++;
    } else {
      acc.push({ x: click.x, y: click.y, count: 1, element: click.element, text: click.text });
    }
    
    return acc;
  }, [] as Array<{ x: number; y: number; count: number; element: string; text: string | null }>);
  
  // Find max count for color scaling
  const maxCount = Math.max(...groupedClicks.map(g => g.count), 1);
  
  return (
    <Card className='bg-slate-800/60 border-white/10'>
      <CardHeader>
        <CardTitle className='text-white'>Click Heatmap</CardTitle>
        <CardDescription className='text-slate-400'>
          Visual representation of where users click
        </CardDescription>
        
        {/* Page Selector */}
        <div className='flex gap-2 flex-wrap mt-4'>
          {pages.slice(0, 10).map((page) => (
            <button
              key={page}
              onClick={() => setSelectedPage(page)}
              className={`px-3 py-1 rounded-lg text-sm transition-all ${
                selectedPage === page
                  ? 'bg-violet-500 text-white'
                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {clicks.length === 0 ? (
          <div className='text-center py-12 text-slate-400'>
            No click data available for this page
          </div>
        ) : (
          <div className='space-y-4'>
            {/* Heatmap visualization */}
            <div className='bg-slate-900/60 rounded-lg p-4 relative min-h-[400px] border border-slate-700/50'>
              <div className='text-xs text-slate-400 mb-4'>
                {clicks.length} total clicks • {groupedClicks.length} unique locations
              </div>
              
              {/* Render click points */}
              <div className='relative'>
                {groupedClicks.map((group, idx) => {
                  const intensity = group.count / maxCount;
                  const size = 20 + (intensity * 30); // 20-50px
                  const opacity = 0.3 + (intensity * 0.7); // 0.3-1.0
                  
                  return (
                    <div
                      key={idx}
                      className='absolute rounded-full transition-all hover:scale-110'
                      style={{
                        left: `${(group.x / 1920) * 100}%`, // Assuming 1920px width
                        top: `${Math.min((group.y / 3000) * 100, 95)}%`, // Assuming ~3000px height
                        width: `${size}px`,
                        height: `${size}px`,
                        backgroundColor: `rgba(139, 92, 246, ${opacity})`, // violet
                        boxShadow: `0 0 ${size}px rgba(139, 92, 246, ${opacity * 0.5})`,
                      }}
                      title={`${group.count} clicks on ${group.element}${group.text ? `: "${group.text.substring(0, 30)}"` : ''}`}
                    >
                      <div className='absolute inset-0 flex items-center justify-center text-white text-xs font-bold'>
                        {group.count}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Click details table */}
            <div className='space-y-2'>
              <h4 className='text-sm font-medium text-white'>Most Clicked Elements</h4>
              <div className='space-y-1'>
                {groupedClicks
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 10)
                  .map((group, idx) => (
                    <div
                      key={idx}
                      className='flex items-center justify-between bg-slate-700/30 rounded px-3 py-2'
                    >
                      <div className='flex-1'>
                        <span className='text-sm text-white font-medium'>{group.element}</span>
                        {group.text && (
                          <span className='text-xs text-slate-400 ml-2'>
                            "{group.text.substring(0, 50)}{group.text.length > 50 ? '...' : ''}"
                          </span>
                        )}
                      </div>
                      <div className='flex items-center gap-3'>
                        <div className='text-sm text-slate-300'>{group.count} clicks</div>
                        <div className='w-24 bg-slate-600/50 rounded-full h-2'>
                          <div
                            className='bg-violet-500 h-2 rounded-full'
                            style={{ width: `${(group.count / maxCount) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
