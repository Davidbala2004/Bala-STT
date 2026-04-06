"use client";

import { useState, useCallback } from "react";

// ---------------------------------------------------------------------------
// Types for Evaluation Result (Matches Backend Payload)
// ---------------------------------------------------------------------------

export interface EvaluationWord {
  word: string;
  start: number | null;
  end: number | null;
  status: "correct" | "mispronounced" | "skipped";
}

export interface EvaluationResult {
  accuracy_score: number;
  fluency_score: number;
  wpm: number;
  total_words: number;
  correct_words: number;
  word_map: EvaluationWord[];
}

interface UseEvaluationResult {
  isEvaluating: boolean;
  result: EvaluationResult | null;
  error: string | null;
  evaluateReading: (audioBlob: Blob, expectedText: string) => Promise<void>;
  reset: () => void;
}

/**
 * useEvaluation — Frontend hook for connecting to the FastAPI "Judge" service.
 * Targets http://localhost:8000/evaluate. 
 * Includes aggressive [TRACE] logs for monitoring the frontend/backend bridge.
 */
export function useEvaluation(): UseEvaluationResult {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const evaluateReading = useCallback(async (audioBlob: Blob, expectedText: string) => {
    console.log("[useEvaluation] [TRACE] evaluateReading invoked.");
    console.log("[useEvaluation] [TRACE] audioBlob Size:", (audioBlob.size / 1024).toFixed(2), "KB");
    console.log("[useEvaluation] [TRACE] audioBlob Type:", audioBlob.type);

    setIsEvaluating(true);
    setResult(null);
    setError(null);

    // Prepare Multipart/Form-Data payload
    const formData = new FormData();
    formData.append("audio", audioBlob, "evaluation_session.webm");
    formData.append("expected_text", expectedText);

    console.log("[useEvaluation] [TRACE] FormData prepared. Dispatching POST request to Judges Core...");

    try {
      const response = await fetch("http://localhost:8000/evaluate", {
        method: "POST",
        body: formData,
      });

      console.log("[useEvaluation] [TRACE] Network response received. HTTP Status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("[useEvaluation] [ERROR] Handshake rejected by server:", errorText);
        throw new Error(`Evaluation failed (${response.status}): ${response.statusText}`);
      }

      const data: EvaluationResult = await response.json();
      console.log("[useEvaluation] [SUCCESS] Received Evaluation Results from Judge Engine:", data);
      
      setResult(data);
    } catch (err) {
      console.error("[useEvaluation] [CRITICAL] The bridge between Frontend and Backend has failed:", err);
      setError((err as Error).message);
    } finally {
      console.log("[useEvaluation] [TRACE] evaluateReading process finished.");
      setIsEvaluating(false);
    }
  }, []);

  const reset = useCallback(() => {
    console.log("[useEvaluation] [TRACE] State reset requested.");
    setResult(null);
    setError(null);
    setIsEvaluating(false);
  }, []);

  return {
    isEvaluating,
    result,
    error,
    evaluateReading,
    reset,
  };
}
