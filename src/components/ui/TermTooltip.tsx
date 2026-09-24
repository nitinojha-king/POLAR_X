"use client";

/**
 * P1-3 — inline term tooltip: dotted underline + browser title +
 * an aria-label so screen readers also get the plain-English meaning.
 */
import { lookupTerm } from "@/lib/glossary";

export function Term({ word, children }: { word: string; children?: React.ReactNode }) {
  const definition = lookupTerm(word);
  if (!definition) return <span>{children ?? word}</span>;
  return (
    <span
      className="cursor-help underline decoration-dotted decoration-2 underline-offset-2"
      title={definition}
      aria-label={`${word}: ${definition}`}
      tabIndex={0}
      role="button"
    >
      {children ?? word}
    </span>
  );
}
