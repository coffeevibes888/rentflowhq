'use client';

import { useRef, useEffect, useMemo, useCallback, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, FileText, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DocumentSection {
  id: string;
  title: string;
  level: number;
  offsetTop: number;
}

export interface ReviewStepProps {
  leaseHtml: string;
  documentName?: string;
  onContinue: () => void;
  className?: string;
}

function extractDocumentSections(container: HTMLElement): DocumentSection[] {
  const sections: DocumentSection[] = [];
  const headings = container.querySelectorAll('h1, h2, h3, h4');
  
  headings.forEach((heading, index) => {
    const level = parseInt(heading.tagName[1]);
    const id = `section-${index}`;
    heading.id = id;
    
    sections.push({
      id,
      title: heading.textContent || `Section ${index + 1}`,
      level,
      offsetTop: (heading as HTMLElement).offsetTop,
    });
  });
  
  return sections;
}

export default function ReviewStep({
  leaseHtml,
  documentName = 'Lease Agreement',
  onContinue,
  className,
}: ReviewStepProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [sections, setSections] = useState<DocumentSection[]>([]);
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [showOutline, setShowOutline] = useState(false);

  // Extract sections after content renders
  useEffect(() => {
    if (contentRef.current) {
      const extracted = extractDocumentSections(contentRef.current);
      setSections(extracted);
      if (extracted.length > 0) {
        setActiveSection(extracted[0].id);
      }
    }
  }, [leaseHtml]);

  // Track scroll position to highlight active section
  const handleScroll = useCallback(() => {
    if (!contentRef.current || sections.length === 0) return;
    
    const scrollTop = contentRef.current.scrollTop;
    const containerHeight = contentRef.current.clientHeight;
    
    // Find the section that's currently in view
    for (let i = sections.length - 1; i >= 0; i--) {
      if (sections[i].offsetTop <= scrollTop + containerHeight / 3) {
        setActiveSection(sections[i].id);
        break;
      }
    }
  }, [sections]);

  // Scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element && contentRef.current) {
      contentRef.current.scrollTo({
        top: element.offsetTop - 20,
        behavior: 'smooth',
      });
      setActiveSection(sectionId);
      setShowOutline(false);
    }
  }, []);

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-gray-500" />
          <h3 className="text-sm font-semibold text-gray-900">{documentName}</h3>
        </div>
        {sections.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOutline(!showOutline)}
            className="text-gray-600 hover:text-gray-900"
          >
            <List className="h-4 w-4 mr-1" />
            <span className="hidden sm:inline">Contents</span>
          </Button>
        )}
      </div>

      {/* Content area */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* Document outline (mobile: overlay, desktop: sidebar) */}
        {showOutline && sections.length > 0 && (
          <>
            {/* Mobile overlay backdrop */}
            <div 
              className="absolute inset-0 bg-black/20 z-10 lg:hidden"
              onClick={() => setShowOutline(false)}
            />
            
            {/* Outline panel */}
            <div className={cn(
              'absolute lg:relative z-20 bg-white border-r border-gray-200',
              'w-64 h-full overflow-y-auto',
              'lg:block'
            )}>
              <div className="p-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Table of Contents
                </h4>
                <nav className="space-y-1">
                  {sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={cn(
                        'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                        'hover:bg-gray-100',
                        activeSection === section.id
                          ? 'bg-violet-50 text-violet-700 font-medium'
                          : 'text-gray-600',
                        section.level === 1 && 'font-medium',
                        section.level === 2 && 'pl-6',
                        section.level === 3 && 'pl-9',
                        section.level === 4 && 'pl-12'
                      )}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </>
        )}

        {/* Document content */}
        <div 
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white"
        >
          <div
            className="prose prose-sm sm:prose max-w-none text-gray-800"
            style={{ 
              fontSize: 'clamp(14px, 2.5vw, 16px)', 
              lineHeight: '1.7' 
            }}
            dangerouslySetInnerHTML={{ __html: leaseHtml }}
          />
        </div>
      </div>

      {/* Footer with continue button */}
      <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 flex-shrink-0">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 hidden sm:block">
            Please review the entire document before signing
          </p>
          <Button
            onClick={onContinue}
            className="w-full sm:w-auto bg-violet-600 hover:bg-violet-700 text-white"
          >
            Continue to Sign
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
