// =============================================================================
// BlurGate.tsx — Visibility Gate Component
// =============================================================================
// Controls the "fog of reading" — only the active chunk and its immediate
// neighbors are clearly visible. All other text is progressively blurred.
//
// Visibility rules:
//   Distance 0 (active chunk):  Full clarity, accent glow
//   Distance 1 (adjacent):      Visible, slightly dimmed (opacity 0.85)
//   Distance 2:                 Heavy blur, low opacity
//   Distance 3+:                Near-invisible blur
// =============================================================================

"use client";

import React, { useMemo } from "react";
import type { Story, ReadingCursor, Word } from "@/lib/types";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BlurGateProps {
  story: Story;
  cursor: ReadingCursor;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Calculate the "distance" of a chunk from the active chunk */
function getChunkDistance(
  chunkPIdx: number,
  chunkSIdx: number,
  chunkCIdx: number,
  cursor: ReadingCursor
): number {
  // Story complete
  if (cursor.paragraphIndex < 0) return 0;

  // Different paragraph = far away
  if (chunkPIdx !== cursor.paragraphIndex) {
    return Math.abs(chunkPIdx - cursor.paragraphIndex) + 3;
  }

  // Different sentence in same paragraph
  if (chunkSIdx !== cursor.sentenceIndex) {
    return Math.abs(chunkSIdx - cursor.sentenceIndex) + 2;
  }

  // Same sentence — distance is chunk index difference
  return Math.abs(chunkCIdx - cursor.chunkIndex);
}

/** Get CSS classes for a word based on its status */
function getWordClasses(word: Word, isInActiveChunk: boolean): string {
  const base = "word-span inline transition-all duration-300 ease-out";

  switch (word.status) {
    case "active":
      return `${base} word-active`;
    case "correct":
      return `${base} word-correct`;
    case "skipped":
      return `${base} word-skipped`;
    case "wrong":
      return `${base} word-wrong`;
    case "pending":
    default:
      return `${base} ${isInActiveChunk ? "word-pending-visible" : "word-pending"}`;
  }
}

/** Get inline styles for blur/opacity based on chunk distance */
function getChunkStyles(distance: number): React.CSSProperties {
  if (distance === 0) {
    return {
      filter: "blur(0px)",
      opacity: 1,
      transition: "filter 0.4s ease, opacity 0.4s ease",
    };
  }
  if (distance === 1) {
    return {
      filter: "blur(0px)",
      opacity: 0.8,
      transition: "filter 0.4s ease, opacity 0.4s ease",
    };
  }
  if (distance === 2) {
    return {
      filter: "blur(2px)",
      opacity: 0.45,
      transition: "filter 0.4s ease, opacity 0.4s ease",
    };
  }
  // Distance 3+
  return {
    filter: `blur(${Math.min(distance * 2, 8)}px)`,
    opacity: Math.max(0.1, 0.3 - (distance - 3) * 0.05),
    transition: "filter 0.4s ease, opacity 0.4s ease",
  };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BlurGate({ story, cursor }: BlurGateProps) {
  // Memoize the rendered paragraphs so we only re-render on cursor changes
  const content = useMemo(() => {
    return story.paragraphs.map((paragraph, pIdx) => (
      <div
        key={paragraph.id}
        className="paragraph-block mb-8 leading-relaxed"
        id={`paragraph-${pIdx}`}
      >
        {paragraph.sentences.map((sentence, sIdx) => (
          <span key={sentence.id} className="sentence-span">
            {sentence.chunks.map((chunk, cIdx) => {
              const distance = getChunkDistance(pIdx, sIdx, cIdx, cursor);
              const isActive = distance === 0;
              const chunkStyle = getChunkStyles(distance);

              return (
                <span
                  key={chunk.id}
                  className={`chunk-span inline ${
                    isActive ? "chunk-active" : ""
                  } ${chunk.status === "complete" ? "chunk-complete" : ""}`}
                  style={chunkStyle}
                  id={`chunk-${pIdx}-${sIdx}-${cIdx}`}
                >
                  {chunk.words.map((word, wIdx) => (
                    <span
                      key={word.id}
                      className={getWordClasses(word, isActive)}
                      id={`word-${pIdx}-${sIdx}-${cIdx}-${wIdx}`}
                    >
                      {word.display}
                      {/* Add space after each word except the last in the chunk */}
                      {wIdx < chunk.words.length - 1 ? " " : ""}
                    </span>
                  ))}
                  {/* Space between chunks */}
                  {cIdx < sentence.chunks.length - 1 ? " " : ""}
                </span>
              );
            })}
            {/* Space between sentences */}
            {sIdx < paragraph.sentences.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
    ));
  }, [story, cursor]);

  return (
    <div className="blur-gate-container" id="blur-gate">
      {content}
    </div>
  );
}
