"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Zap, BookOpen, AlertCircle, XCircle, FileText, Activity, FileAudio } from "lucide-react";

export interface EvaluationWord {
  word: string;
  start: number | null;
  end: number | null;
  status: string;
}

export interface EvaluationResult {
  accuracy_score?: number;
  wpm?: number;
  chunk_score?: number;
  mispronounced_words?: string[];
  missing_words?: string[];
  extra_words?: string[];
  repeated_words?: string[];
  word_map?: EvaluationWord[];
  
  // Aliases for robustness based on payload versions
  wcpm?: number;
  chunking_score?: number;
  wrong_words?: string[];
  skipped_words?: string[];
}

export default function ResultsPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<EvaluationResult | null>(null);

  useEffect(() => {
    setMounted(true);
    // Ensuring safety across legacy mock iterations
    const stored = sessionStorage.getItem('latest_evaluation') || sessionStorage.getItem('evaluationData');
    if (stored) {
       try {
         setData(JSON.parse(stored));
       } catch (err) {
         console.error("Parse Error:", err);
       }
    }
  }, []);

  if (!mounted) {
    return <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center text-white text-2xl font-bold">Loading Analytics...</div>;
  }

  if (!data) {
    return (
      <div className="flex min-h-screen bg-[#0B0F19] items-center justify-center text-white">
         <div className="bg-[#131A2A] border border-[#1E293B] p-10 rounded-2xl flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-6 tracking-wide">No Report Data</h2>
            <button 
              onClick={() => router.push("/")} 
              className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all flex items-center gap-2"
            >
              <Activity size={20}/> Return Home
            </button>
         </div>
      </div>
    );
  }

  // Pre-process chunks
  const chunks: EvaluationWord[][] = [];
  let currentChunk: EvaluationWord[] = [];
  
  (data?.word_map || []).forEach(item => {
    currentChunk.push(item);
    // Split chunks at standard punctuation marks
    if (/[.,?!;:]/.test(item.word)) {
      chunks.push(currentChunk);
      currentChunk = [];
    }
  });
  if (currentChunk.length > 0) chunks.push(currentChunk);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white p-8 w-full flex flex-col items-center">
      
      {/* Header Container */}
      <div className="w-full max-w-6xl text-center md:text-left">
        <h1 className="text-3xl font-black text-white mb-2 tracking-tight uppercase">Performance Metrics</h1>
        <p className="text-slate-500 font-medium tracking-wide">Detailed breakdown of the reading session</p>
      </div>

      {/* The 6-Card Grid Container (Explicit Fix) */}
      <div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
         
         {/* Card 1: ACCURACY */}
         <div className="bg-[#131A2A] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
               <CheckCircle size={20} className="text-emerald-400" /> 
               <span className="font-bold tracking-widest uppercase text-xs">Accuracy</span>
            </div>
            <div className="text-5xl font-black text-white mt-2">
               {data?.accuracy_score || 0}%
            </div>
         </div>

         {/* Card 2: READING SPEED */}
         <div className="bg-[#131A2A] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
               <Zap size={20} className="text-indigo-400" /> 
               <span className="font-bold tracking-widest uppercase text-xs">Reading Speed</span>
            </div>
            <div className="text-5xl font-black text-white mt-2">
               {data?.wpm ?? (data?.wcpm || 0)} <span className="text-xl text-slate-500 ml-1">WCPM</span>
            </div>
         </div>

         {/* Card 3: CHUNKING SCORE */}
         <div className="bg-[#131A2A] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
               <BookOpen size={20} className="text-blue-400" /> 
               <span className="font-bold tracking-widest uppercase text-xs">Chunking Score</span>
            </div>
            <div className="text-5xl font-black text-white mt-2">
               {data?.chunk_score ?? (data?.chunking_score || 0)}%
            </div>
         </div>

         {/* Card 4: MISPRONOUNCED */}
         <div className="bg-[#131A2A] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
               <AlertCircle size={20} className="text-amber-500" /> 
               <span className="font-bold tracking-widest uppercase text-xs">Mispronounced</span>
            </div>
            <div className="text-5xl font-black text-white mt-2">
               {(data?.mispronounced_words?.length ?? data?.wrong_words?.length) || 0}
            </div>
         </div>

         {/* Card 5: SKIPPED WORDS */}
         <div className="bg-[#131A2A] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
               <XCircle size={20} className="text-red-500" /> 
               <span className="font-bold tracking-widest uppercase text-xs">Skipped Words</span>
            </div>
            <div className="text-5xl font-black text-white mt-2">
               {(data?.missing_words?.length ?? data?.skipped_words?.length) || 0}
            </div>
         </div>

         {/* Card 6: EXTRA / REPEATED */}
         <div className="bg-[#131A2A] p-6 rounded-2xl border border-[#1E293B] shadow-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center gap-3 text-slate-400 mb-2">
               <FileText size={20} className="text-slate-400" /> 
               <span className="font-bold tracking-widest uppercase text-xs">Extra / Repeated</span>
            </div>
            <div className="text-5xl font-black text-white mt-2">
               {((data?.extra_words?.length || 0) + (data?.repeated_words?.length || 0))}
            </div>
         </div>

      </div>

      {/* Detailed Chunk Analysis Block Component */}
      <div className="w-full max-w-6xl mt-12 bg-[#131A2A] rounded-2xl border border-[#1E293B] p-8 shadow-2xl">
         
         <div className="flex items-center gap-3 mb-2">
           <FileAudio size={24} className="text-blue-400" />
           <h2 className="text-2xl font-bold text-white tracking-wide">Detailed Chunk Analysis</h2>
         </div>

         {/* Separated FlexBox Legend (Explicit Fix) */}
         <div className="flex flex-wrap gap-4 text-sm font-bold mt-4 mb-8 bg-[#0B0F19] border border-[#1E293B] p-4 rounded-xl">
           <span className="text-slate-300 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-slate-300"/>Correct
           </span>
           <span className="text-red-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-400"/>Mispronounced
           </span>
           <span className="text-slate-500 line-through decoration-slate-600 flex items-center gap-2">
              Skipped
           </span>
           <span className="text-amber-400 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-400"/>Extra / Repeated
           </span>
         </div>

         {/* Chunk Visualizer Cards (Iterated) */}
         <div className="block">
           {chunks.map((chunk, cIdx) => (
             <div key={cIdx} className="bg-[#1B2438] p-6 rounded-xl border border-slate-700/50 mb-4 leading-[2.5em] tracking-wide text-xl">
               {chunk.map((item, i) => {
                 let styleClass = "text-slate-200 transition-colors";

                 // Explicit styling matching strictly to user requests
                 if (item.status === 'mispronounced' || item.status === 'wrong') {
                   styleClass = "text-red-400 font-bold bg-red-500/10 px-2 py-1 rounded-md border border-red-500/20";
                 } else if (item.status === 'skipped' || item.status === 'missing') {
                   styleClass = "text-slate-500 line-through decoration-red-500/50";
                 } else if (item.status === 'extra' || item.status === 'repeated') {
                   styleClass = "text-amber-400 font-medium bg-amber-500/10 px-2 py-1 rounded-md border border-amber-500/20";
                 }

                 return (
                   <React.Fragment key={i}>
                     <span className={styleClass}>{item.word}</span>
                     {" "}
                   </React.Fragment>
                 );
               })}
             </div>
           ))}
         </div>
      </div>

      {/* Footer Navigation Component */}
      <div className="w-full max-w-6xl flex justify-end mt-12 pb-24">
         <button 
           onClick={() => router.push("/")}
           className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-full transition-all shadow-xl shadow-blue-600/20"
         >
           Close Report
         </button>
      </div>

    </div>
  );
}
