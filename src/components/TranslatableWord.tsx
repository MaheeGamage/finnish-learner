import { useState, useEffect, useRef } from 'react';
import { translateWord } from '@/utils/translator';
import { TRANSLATION_DELAY_MS, TEXT_COLORS, BACKGROUND_COLORS, TRANSLATION_MODES, TranslationMode } from '@/config/constants';

interface TranslatableWordProps {
    word: string;
    sourceLang: 'en' | 'fi';
    targetLang: 'en' | 'fi';
    onHover: () => void;
    isActive: boolean;
    translationMode: TranslationMode;
}

export default function TranslatableWord({ 
    word, 
    sourceLang, 
    targetLang, 
    onHover, 
    isActive,
    translationMode 
}: TranslatableWordProps) {
    const [translation, setTranslation] = useState<string>('');
    const [isHighlighted, setIsHighlighted] = useState(false);
    const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
    const wordRef = useRef<HTMLSpanElement>(null);
    const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

    const handleTranslation = async (text: string) => {
        const result = await translateWord(text, sourceLang, targetLang);
        setTranslation(result);
    };

    const updateTooltipPosition = () => {
        if (wordRef.current) {
            const rect = wordRef.current.getBoundingClientRect();
            const spaceAbove = rect.top;
            const spaceBelow = window.innerHeight - rect.bottom;
            setTooltipPosition(spaceAbove > spaceBelow ? 'top' : 'bottom');
        }
    };

    const handleMouseEnter = () => {
        if (translationMode === TRANSLATION_MODES.OFF) return;
        if (translationMode !== TRANSLATION_MODES.HOVER && translationMode !== TRANSLATION_MODES.BOTH) return;

        onHover();
        setIsHighlighted(true);
        updateTooltipPosition();
        
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        
        timerRef.current = setTimeout(async () => {
            if (!translation) {
                await handleTranslation(word);
            }
        }, TRANSLATION_DELAY_MS);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent double-tap zoom
        handleMouseEnter();
    };

    const handleMouseLeave = () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setIsHighlighted(false);
    };

    const handleSelection = (e: React.MouseEvent) => {
        if (translationMode === TRANSLATION_MODES.OFF) return;
        if (translationMode !== TRANSLATION_MODES.SELECTION && translationMode !== TRANSLATION_MODES.BOTH) return;

        const selection = window.getSelection();
        if (selection && selection.toString().trim()) {
            onHover();
            setIsHighlighted(true);
            updateTooltipPosition();
            handleTranslation(selection.toString().trim());
            e.stopPropagation();
        }
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
        }
    }, [isActive]);

    // Listen for scroll and resize events to update tooltip position
    useEffect(() => {
        const handleScroll = () => {
            if (isHighlighted) {
                updateTooltipPosition();
            }
        };

        window.addEventListener('scroll', handleScroll);
        window.addEventListener('resize', handleScroll);

        return () => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('resize', handleScroll);
        };
    }, [isHighlighted]);

    const tooltipClass = tooltipPosition === 'top' 
        ? '-top-8 -translate-y-1' 
        : 'top-full translate-y-1';

    return (
        <span className="relative inline-block" ref={wordRef}>
            <span 
                className={`cursor-pointer px-1 py-0.5 rounded transition-all duration-200 ${TEXT_COLORS.DEFAULT}
                    ${isHighlighted && isActive ? `${BACKGROUND_COLORS.HIGHLIGHTED} ${TEXT_COLORS.HIGHLIGHTED}` : ''}`}
                onMouseEnter={handleMouseEnter}
                onTouchStart={handleTouchStart}
                onMouseLeave={handleMouseLeave}
                onTouchEnd={handleMouseLeave}
                onMouseUp={handleSelection}
            >
                {word}
            </span>
            {isHighlighted && isActive && translation && (
                <span className={`absolute left-1/2 transform -translate-x-1/2 
                    bg-white border border-gray-200 text-gray-900 
                    px-2 py-1 rounded-lg text-sm shadow-lg 
                    whitespace-nowrap z-10 max-w-[90vw] overflow-hidden 
                    text-ellipsis ${tooltipClass}`}>
                    {translation}
                </span>
            )}
        </span>
    );
}