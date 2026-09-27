import React, { useState } from 'react';
import { X, Copy, Check, Eye } from 'lucide-react';
import { Exercise } from '../types/workout';
import { formatRemainingText } from '../utils/formatter';

interface StreamOverlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  totalCompleted: number;
}

export const StreamOverlayModal: React.FC<StreamOverlayModalProps> = ({
  isOpen,
  onClose,
  exercises,
  totalCompleted,
}) => {
  const [bgMode, setBgMode] = useState<'dark' | 'chroma' | 'transparent'>('dark');
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen) return null;

  const pushup = exercises.find((e) => e.isMainGoal || e.id === 'pushup');
  const pushupRemaining = pushup ? Math.max(0, pushup.target - pushup.completed) : 0;
  const pushupDone = pushup ? pushup.completed : 0;
  const pushupTarget = pushup ? pushup.target : 500;
  const subExercises = exercises.filter((e) => !e.isMainGoal && e.id !== 'pushup' && (e.target > 0 || e.completed > 0));

  const handleCopy = () => {
    navigator.clipboard.writeText(formatRemainingText(exercises));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 select-none ${
        bgMode === 'chroma'
          ? 'bg-[#00ff00]'
          : bgMode === 'transparent'
          ? 'bg-neutral-950/90 backdrop-blur-md'
          : 'bg-neutral-950'
      }`}
    >
      {/* Overlay Toolbar */}
      <div className="absolute top-4 right-4 flex items-center gap-2 bg-neutral-900/90 p-1.5 rounded-xl border border-neutral-700 shadow-xl">
        <span className="text-[10px] text-neutral-400 font-bold px-1">背景:</span>
        <button
          onClick={() => setBgMode('dark')}
          className={`px-2 py-0.5 rounded text-xs font-bold ${
            bgMode === 'dark' ? 'bg-neutral-700 text-white' : 'text-neutral-400'
          }`}
        >
          ダーク
        </button>
        <button
          onClick={() => setBgMode('chroma')}
          className={`px-2 py-0.5 rounded text-xs font-bold ${
            bgMode === 'chroma' ? 'bg-green-600 text-white' : 'text-neutral-400'
          }`}
        >
          クロマキー緑
        </button>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-bold ml-2 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>残りコピー</span>
        </button>

        <button
          onClick={onClose}
          className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white cursor-pointer ml-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Big Stream HUD Card */}
      <div className="w-full max-w-2xl bg-neutral-900/95 border-2 border-amber-500/80 rounded-3xl p-5 sm:p-7 shadow-2xl text-center backdrop-blur-md">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950/80 text-red-300 border border-red-800 font-black text-xs uppercase mb-2">
          🔥 筋トレ配信 耐久チャレンジ
        </div>

        {/* Huge Remaining Display (Total across all exercises) */}
        <div className="text-neutral-400 font-bold text-xs sm:text-sm mb-0.5">
          全種目 ノルマ残り合計
        </div>
        <div className="flex items-baseline justify-center gap-2 font-mono my-1">
          <span className="text-6xl sm:text-7xl font-black text-rose-500 tracking-tight drop-shadow-[0_0_20px_rgba(244,63,94,0.4)]">
            {exercises.reduce((acc, e) => acc + Math.max(0, e.target - e.completed), 0)}
          </span>
          <span className="text-xl sm:text-2xl font-sans font-bold text-neutral-300">回</span>
        </div>

        <div className="flex items-center justify-center gap-3 text-xs text-neutral-300 font-mono mt-1">
          <span className="bg-neutral-800/90 px-3 py-1 rounded-lg border border-neutral-700">
            総消化: <b className="text-emerald-400">{totalCompleted}</b>回
          </span>
        </div>

        {/* All Exercises Grid */}
        <div className="mt-4 pt-3 border-t border-neutral-800">
          <div className="text-[11px] text-neutral-400 font-bold uppercase tracking-wider mb-2">
            ── 各種目 残りノルマ一覧 ──
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {exercises.map((ex) => {
              const rem = Math.max(0, ex.target - ex.completed);
              return (
                <div
                  key={ex.id}
                  className="p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col items-center"
                >
                  <span className="text-lg">{ex.icon}</span>
                  <span className="font-bold text-xs text-white truncate max-w-full">{ex.name}</span>
                  <span
                    className={`text-sm font-black font-mono mt-0.5 ${
                      rem === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {rem === 0 ? '達成!' : `残 ${rem}回`}
                  </span>
                  <span className="text-[10px] text-neutral-500 font-mono">
                    (済 {ex.completed} / 目 {ex.target})
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
