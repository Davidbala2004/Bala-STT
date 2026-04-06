"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { parseStory, getWordAtCursor } from "@/lib/parseStory";
import { useSherpa } from "@/hooks/useSherpa";
import { useAudioRecorder } from "@/hooks/useAudioRecorder";
import { useEvaluation } from "@/hooks/useEvaluation";
import BlurGate from "@/components/BlurGate";
import type { Story } from "@/lib/types";
import { Book, Mic, Square, RefreshCcw } from "lucide-react";

const STORY_TEXT = `The sun rose slowly over the mountains, painting the sky with shades of orange and pink. Birds began to sing their morning songs, welcoming the new day.

A young boy named Sam walked along the forest path. He carried a small backpack filled with books and snacks. The trail was quiet, and the air smelled of pine.

Sam found a clearing near a stream. He sat down on a flat rock, opened his favorite book, and began to read aloud. His voice echoed softly through the trees.`;

const STORY_TITLE = "Morning in the Forest";

export default function ReadingApp() {
  const router = useRouter();
  const [story] = useState<Story>(() => parseStory(STORY_TEXT, STORY_TITLE));
  
  const { status, start: startSherpa, stop: stopSherpa, cursor, correctCount } = useSherpa(story);
  const { isRecording, startRecording, stopRecording, timeRemaining } = useAudioRecorder();
  const { isEvaluating, result, evaluateReading } = useEvaluation();

  const [isComplete, setIsComplete] = useState(false);
  const isStoppingRef = useRef(false);

  useEffect(() => {
    if (result) {
      sessionStorage.setItem("latest_evaluation", JSON.stringify(result));
      router.push("/results");
    }
  }, [result, router]);

  const handleStopSession = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    
    try {
        const finalBlob = await stopRecording();
        stopSherpa();
        if (finalBlob) evaluateReading(finalBlob, STORY_TEXT);
    } catch (err) {
        console.error("Teardown error:", err);
    }
  }, [stopRecording, stopSherpa, evaluateReading]);

  const handleStartSession = useCallback(async () => {
    isStoppingRef.current = false;
    try {
      await startSherpa();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, sampleRate: 48000, echoCancellation: true } });
      startRecording(stream);
    } catch (err) {
      console.error("Startup error:", err);
    }
  }, [startSherpa, startRecording]);

  useEffect(() => {
    if (cursor.paragraphIndex < 0 && !isComplete) {
      setIsComplete(true);
      handleStopSession();
    }
  }, [cursor, isComplete, handleStopSession]);

  if (isEvaluating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F19] text-white">
        <div className="w-16 h-16 border-4 border-[#1E293B] border-t-blue-500 rounded-full animate-spin mb-6" />
        <h2 className="text-xl font-bold tracking-widest text-blue-400">ANALYZING RECORDING...</h2>
      </div>
    );
  }

  const formatTime = (secs: number) => {
     const m = Math.floor(secs / 60);
     const s = secs % 60;
     return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <main className="min-h-screen bg-[#0B0F19] text-slate-200 font-sans flex flex-col relative pb-32">
      <style>{`
        .word-active {
          background-color: rgba(99, 102, 241, 0.2) !important;
          border: 1px solid rgba(129, 140, 248, 0.8) !important;
          border-radius: 0.375rem !important;
          padding: 2px 4px !important;
          box-shadow: 0 0 10px rgba(99,102,241,0.5) !important;
          color: white !important;
        }
      `}</style>
      
      {/* Header */}
      <div className="flex items-center justify-center pt-8 pb-4">
        <Book className="w-8 h-8 text-blue-500 mr-3" />
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500">ReadAloud</h1>
      </div>

      {/* Status Bar */}
      <div className="w-full bg-[#131A2A] border-y border-[#1E293B] py-2 text-center mb-10 shadow-sm">
        <span className="text-purple-400 text-sm font-semibold tracking-wider">
          {isRecording ? "Listening... Read clearly!" : status === "ready" ? "Connected! Start reading..." : "Initializing..."}
        </span>
      </div>

      {/* Main Layout Grid */}
      <div className="w-full max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
         
         {/* Left Column (70%) */}
         <div className="lg:col-span-8 bg-[#131A2A] rounded-xl p-8 border border-[#1E293B] shadow-lg flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-8 text-white self-start">{story.title}</h2>
            <div className="text-xl md:text-2xl leading-[2.2em] text-slate-400 font-medium pb-8 w-full">
               <BlurGate story={story} cursor={cursor} />
            </div>
         </div>

         {/* Right Column (30%) */}
         <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-[#131A2A] rounded-xl p-6 border border-[#1E293B] shadow-lg">
               <h3 className="text-sm font-bold text-slate-500 tracking-widest uppercase mb-6 border-b border-[#1E293B] pb-4">PROGRESS</h3>
               
               <div className="flex flex-col gap-8">
                  <div className="flex flex-col">
                     <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Words read</span>
                     <div className="text-4xl font-bold text-white tracking-tight">{correctCount} <span className="text-xl text-slate-500 font-normal">/ {story.totalWords}</span></div>
                  </div>
                  
                  <div className="flex flex-col">
                     <span className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-2">Time elapsed</span>
                     <div className={`text-4xl font-bold tracking-tight ${timeRemaining < 15 ? 'text-red-400' : 'text-white'}`}>{formatTime(timeRemaining)}</div>
                  </div>
               </div>
            </div>
         </div>

      </div>

      {/* Controls Absolute Bottom Center */}
      <div className="fixed bottom-0 inset-x-0 h-32 bg-gradient-to-t from-[#0B0F19] to-transparent flex items-center justify-center gap-6 pb-4">
         
         <button 
           onClick={isRecording ? handleStopSession : handleStartSession}
           className="relative flex items-center justify-center bg-gradient-to-b from-blue-400 to-indigo-600 shadow-[0_0_20px_rgba(99,102,241,0.5)] w-16 h-16 rounded-full hover:scale-105 active:scale-95 transition-transform z-10"
         >
           {isRecording ? <Square fill="white" className="w-6 h-6 text-white" /> : <Mic className="w-8 h-8 text-white" />}
         </button>
         
         <button 
           onClick={() => window.location.reload()}
           className="flex items-center justify-center bg-[#131A2A] border border-[#1E293B] hover:bg-[#1E293B] w-12 h-12 rounded-full transition-colors text-slate-400 hover:text-white group z-10"
         >
           <RefreshCcw className="w-5 h-5 group-active:-rotate-90 transition-transform duration-300" />
         </button>

      </div>
    </main>
  );
}
