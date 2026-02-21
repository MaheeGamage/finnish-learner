import { useState, useEffect, useRef, useCallback } from 'react';
import { translateWord } from '@/utils/translator';
import { hasTextSelection } from '@/utils/textUtils';
import { TRANSLATION_DELAY_MS, TEXT_COLORS, BACKGROUND_COLORS, TRANSLATION_MODES, TranslationMode } from '@/config/constants';

interface TranslatableWordProps {
    word: string;
    tokenIndex: number;
    sourceLang: 'en' | 'fi';
    targetLang: 'en' | 'fi';
    onHover: () => void;
    onTranslated: (tokenIndex: number) => void;
    isActive: boolean;
    isLastTranslated: boolean;
    translationMode: TranslationMode;
}

export default function TranslatableWord({ 
    word, 
    tokenIndex,
    sourceLang, 
    targetLang, 
    onHover, 
    onTranslated,
    isActive,
    isLastTranslated,
    translationMode 
}: TranslatableWordProps) {
    const [translation, setTranslation] = useState<string>('');
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
    const [tooltipCoords, setTooltipCoords] = useState({ top: 0, left: 0 });
    const [isTooltipReady, setIsTooltipReady] = useState(false);
    const wordRef = useRef<HTMLSpanElement>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const updateTooltipPosition = useCallback(() => {
        if (!wordRef.current || !isHighlighted) return;

        try {
            const wordRect = wordRef.current.getBoundingClientRect();
            const viewportHeight = window.innerHeight;
            const viewportWidth = window.innerWidth;
            
            if (wordRect.width === 0) return;
            
            // Pre-calculate tooltip dimensions based on text length
            const fontSize = 14; // text-sm in pixels
            const horizontalPadding = 16; // px-2 in pixels
            const estimatedTooltipWidth = Math.min(
                translation.length * (fontSize * 0.6) + horizontalPadding,
                viewportWidth * 0.8
            );
            const estimatedTooltipHeight = fontSize * 1.5 + 8; // Line height + vertical padding
            
            const minMargin = 8;
            const spaceAbove = wordRect.top - minMargin;
            const spaceBelow = viewportHeight - wordRect.bottom - minMargin;
            
            const position = spaceAbove > spaceBelow ? 'top' : 'bottom';
            setTooltipPosition(position);

            let left = Math.round(wordRect.left + (wordRect.width / 2) - (estimatedTooltipWidth / 2));
            left = Math.max(minMargin, Math.min(left, viewportWidth - estimatedTooltipWidth - minMargin));
            
            const verticalOffset = 6;
            const top = Math.round(position === 'top' 
                ? wordRect.top - estimatedTooltipHeight - verticalOffset
                : wordRect.bottom + verticalOffset);

            // Only update if position has changed significantly
            setTooltipCoords(prev => {
                const hasChanged = 
                    Math.abs(prev.top - top) > 1 || 
                    Math.abs(prev.left - left) > 1;
                return hasChanged ? { top, left } : prev;
            });

            if (!isTooltipReady) {
                requestAnimationFrame(() => setIsTooltipReady(true));
            }
        } catch (error) {
            console.error('Error updating tooltip position:', error);
        }
    }, [isHighlighted, translation, isTooltipReady]);

    const handleTranslation = async (text: string) => {
        try {
            setIsTooltipReady(false);
            const result = await translateWord(text, sourceLang, targetLang);
            if (!result) return;
            
            setTranslation(result);
            onTranslated(tokenIndex);
            // Calculate position while tooltip is invisible
            requestAnimationFrame(() => {
                updateTooltipPosition();
                // Double-check position after a frame
                requestAnimationFrame(updateTooltipPosition);
            });
        } catch (error) {
            console.error('Error translating:', error);
        }
    };

    const handleMouseEnter = () => {
        if (translationMode === TRANSLATION_MODES.OFF) return;
        if (translationMode !== TRANSLATION_MODES.HOVER && translationMode !== TRANSLATION_MODES.BOTH) return;

        // Don't show hover popup if user has text selected
        if (hasTextSelection()) {
            return;
        }

        onHover();
        setIsHighlighted(true);
        
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        
        if (!translation) {
            setIsTooltipReady(false);
            timerRef.current = setTimeout(() => {
                handleTranslation(word);
            }, TRANSLATION_DELAY_MS);
        } else {
            onTranslated(tokenIndex);
            requestAnimationFrame(updateTooltipPosition);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent double-tap zoom
        if (translationMode === TRANSLATION_MODES.OFF) return;
        if (translationMode !== TRANSLATION_MODES.HOVER && translationMode !== TRANSLATION_MODES.BOTH) return;

        // Don't show touch popup if user has text selected
        if (hasTextSelection()) {
            return;
        }

        onHover();
        setIsHighlighted(true);
        updateTooltipPosition();
        
        // Immediate translation for touch
        if (!translation) {
            handleTranslation(word);
        } else {
            onTranslated(tokenIndex);
        }
    };

    const handleMouseLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setIsHighlighted(false);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (!isActive) {
            setIsHighlighted(false);
            setIsTooltipReady(false);
        }
    }, [isActive]);

    // Listen for scroll and resize events to update tooltip position
    useEffect(() => {
        let frameId: number;
        
        const update = () => {
            if (isHighlighted && translation) {
                updateTooltipPosition();
            }
        };

        const handleScroll = () => {
            if (frameId) cancelAnimationFrame(frameId);
            frameId = requestAnimationFrame(update);
        };

        const handleResize = handleScroll;

        if (isHighlighted && translation) {
            frameId = requestAnimationFrame(update);
        }

        window.addEventListener('scroll', handleScroll, { passive: true });
        window.addEventListener('resize', handleResize, { passive: true });
        
        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleResize);
            if (frameId) cancelAnimationFrame(frameId);
        };
    }, [isHighlighted, translation, updateTooltipPosition]);

    useEffect(() => {
        if (!isHighlighted || !translation) return;

        const rafId = requestAnimationFrame(updateTooltipPosition);
        return () => cancelAnimationFrame(rafId);
    }, [isHighlighted, translation, updateTooltipPosition]);

    const lastTranslatedClass = !isHighlighted && isLastTranslated ? BACKGROUND_COLORS.LAST_TRANSLATED : '';
    const highlightClass = isHighlighted
        ? `${TEXT_COLORS.HIGHLIGHTED} ${BACKGROUND_COLORS.HIGHLIGHTED}`
        : TEXT_COLORS.DEFAULT;

    return (
        <span
            ref={wordRef}
            data-token-index={tokenIndex}
            className={`relative inline-block ${highlightClass} ${lastTranslatedClass}`}
            style={{ whiteSpace: 'pre-wrap' }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
        >
            {word}
            {isHighlighted && translation && 
             (translationMode === TRANSLATION_MODES.HOVER || translationMode === TRANSLATION_MODES.BOTH) && (
                <span 
                    ref={tooltipRef}
                    style={{
                        position: 'fixed',
                        top: `${tooltipCoords.top}px`,
                        left: `${tooltipCoords.left}px`,
                        opacity: isTooltipReady ? 1 : 0,
                        transform: `scale(${isTooltipReady ? 1 : 0.98})`,
                        transformOrigin: tooltipPosition === 'top' ? 'bottom center' : 'top center',
                        transition: isTooltipReady 
                            ? 'opacity 0.12s ease-out, transform 0.12s ease-out' 
                            : 'none',
                        visibility: isHighlighted && translation ? 'visible' : 'hidden',
                        willChange: 'transform, opacity',
                    }}
                    className="px-2 py-1 text-sm text-white bg-gray-800/90 rounded shadow-lg z-[9999] 
                        whitespace-nowrap pointer-events-none select-none backdrop-blur-[2px]"
                >
                    {translation}
                </span>
            )}
        </span>
    );
}
