'use client';

import { useState } from 'react';
import TranslatableWord from './TranslatableWord';
import SelectionTranslationPopup from './SelectionTranslationPopup';
import { BACKGROUND_COLORS, TranslationMode } from '../config/readerConfig';
import type { LastTranslatedRange } from '../storage';

interface TranslatableTextProps {
    /** The text to make interactive (source/learning language). */
    text: string;
    sourceLang: 'en' | 'fi';
    targetLang: 'en' | 'fi';
    translationMode: TranslationMode;
    /** Reader highlight of the last-translated token range; omit for no highlight. */
    lastTranslatedRange?: LastTranslatedRange | null;
    /** Notified with the token range whenever a word/selection is translated (e.g. to persist + highlight). */
    onTranslatedRange?: (range: LastTranslatedRange) => void;
    /** Notified of each translated word/selection (e.g. session history). */
    onWordTranslated?: (word: string, translation: string, type: 'hover' | 'selection') => void;
    /** Extra classes on the wrapping element. */
    className?: string;
}

/**
 * Renders a string as interactive, translatable text: hover/touch per-word tooltips plus
 * subtitle-style selection translation — the Reader's reading surface, extracted so the quiz
 * card (and anything else) can reuse the exact same behaviour. Owns only local interaction
 * state (the active word); persistence / session-history concerns stay with the caller via the
 * optional callbacks.
 */
export default function TranslatableText({
    text,
    sourceLang,
    targetLang,
    translationMode,
    lastTranslatedRange = null,
    onTranslatedRange,
    onWordTranslated,
    className,
}: TranslatableTextProps) {
    const [activeWordIndex, setActiveWordIndex] = useState<number | null>(null);

    // Split text preserving newlines and multiple spaces (separators kept as their own tokens).
    const tokens = text
        .split(/(\s+)/g)
        .map((part, index) => ({
            content: part,
            isWhitespace: /^\s+$/.test(part),
            key: index,
        }));

    return (
        <>
            <span data-translatable-text className={className}>
                {tokens.map(({ content, isWhitespace, key }) => {
                    const isLastTranslated =
                        !!lastTranslatedRange && key >= lastTranslatedRange.start && key <= lastTranslatedRange.end;

                    return isWhitespace ? (
                        <span
                            key={key}
                            data-token-index={key}
                            className={isLastTranslated ? BACKGROUND_COLORS.LAST_TRANSLATED : undefined}
                        >
                            {content}
                        </span>
                    ) : (
                        <TranslatableWord
                            key={key}
                            word={content}
                            tokenIndex={key}
                            sourceLang={sourceLang}
                            targetLang={targetLang}
                            onHover={() => setActiveWordIndex(key)}
                            onTranslated={(tokenIndex) => onTranslatedRange?.({ start: tokenIndex, end: tokenIndex })}
                            onWordTranslated={onWordTranslated}
                            isActive={activeWordIndex === key}
                            isLastTranslated={isLastTranslated}
                            translationMode={translationMode}
                        />
                    );
                })}
            </span>

            {/* Subtitle-style popup for phrase/sentence selection within this text. */}
            <SelectionTranslationPopup
                sourceLang={sourceLang}
                targetLang={targetLang}
                translationMode={translationMode}
                isInputMode={false}
                scopeSelector="[data-translatable-text]"
                onTranslated={(range) => onTranslatedRange?.(range)}
                onSelectionTranslated={onWordTranslated}
            />
        </>
    );
}
