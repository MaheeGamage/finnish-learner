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
        
        // Only apply delay for hover
        if (!translation) {
            timerRef.current = setTimeout(async () => {
                await handleTranslation(word);
            }, TRANSLATION_DELAY_MS);
        }
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        e.preventDefault(); // Prevent double-tap zoom
        if (translationMode === TRANSLATION_MODES.OFF) return;
        if (translationMode !== TRANSLATION_MODES.HOVER && translationMode !== TRANSLATION_MODES.BOTH) return;

        onHover();
        setIsHighlighted(true);
        updateTooltipPosition();
        
        // Immediate translation for touch
        if (!translation) {
            handleTranslation(word);
        }
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
            // Immediate translation for selection
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

    return (
        <span 
            ref={wordRef}
            className={`relative inline-block cursor-pointer mx-1 ${isHighlighted ? `${TEXT_COLORS.HIGHLIGHTED} ${BACKGROUND_COLORS.HIGHLIGHTED}` : TEXT_COLORS.DEFAULT}`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            onTouchStart={handleTouchStart}
            onMouseUp={handleSelection}
        >
            {word}
            {isHighlighted && translation && (
                <span 
                    className={`absolute ${
                        tooltipPosition === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
                    } left-1/2 transform -translate-x-1/2 px-2 py-1 text-sm text-white bg-gray-800/80 rounded shadow-lg z-50 whitespace-nowrap`}
                >
                    {translation}
                </span>
            )}
        </span>
    );
}