import React from 'react';
import { X, Sparkles, CheckCircle } from 'lucide-react';
import { Exercise } from '../types/workout';

interface SwanSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSubExercises: Exercise[];
  onSelectExerciseToClear: (exercise: Exercise) => void;
}

export const SwanSelectModal: React.FC<SwanSelectModalProps> = ({
  isOpen,
  onClose,
  activeSubExercises,
  onSelectExerciseToClear,
}) => {
  if (!isOpen) return null;

  // Sort by remaining desc so the biggest burden is first
  const sorted = [...activeSubExercises].sort((a, b) => (b.target - b.completed) - (a.target - a.completed));
  const maxRemainingEx = sorted[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border-2 border-indigo-400 rounded-3xl w-full max-w-md p-5 shadow-2xl shadow-indigo-950/60 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🌌✨</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">銀河ギフト発動！</h3>
              <p className="text-xs text-indigo-300 font-bold">いずれか1種目のノルマを帳消しにします</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-300">
          帳消し（免除）にしたい種目を1つ選んでください：
        </p>

        {/* Quick auto-pick: Most remaining reps */}
        {maxRemainingEx && sorted.length > 1 && (
          <button
            onClick={() => onSelectExerciseToClear(maxRemainingEx)}
            className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-extrabold text-sm border border-indigo-400 shadow-md flex items-center justify-between cursor-pointer active:scale-95 transition"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>一番残りの多い種目を帳消し</span>
            </span>
            <span className="bg-black/30 px-2 py-0.5 rounded text-xs text-indigo-100 font-mono">
              {maxRemainingEx.name}（残{maxRemainingEx.target - maxRemainingEx.completed}回）
            </span>
          </button>
        )}

        {/* List of sub-exercises that have remaining reps */}
        <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
          {sorted.map((ex) => {
            const rem = Math.max(0, ex.target - ex.completed);
            return (
              <button
                key={ex.id}
                onClick={() => onSelectExerciseToClear(ex)}
                className="p-3 rounded-xl bg-neutral-950 hover:bg-indigo-950/60 border border-neutral-700 hover:border-indigo-400 text-left flex items-center justify-between group cursor-pointer active:scale-95 transition"
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ex.icon}</span>
                  <div>
                    <div className="font-extrabold text-sm text-white group-hover:text-indigo-300">
                      {ex.name}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      消化: {ex.completed}回 / 目標: {ex.target}回
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono font-black text-rose-400 bg-neutral-900 px-2 py-1 rounded border border-neutral-800">
                    残り {rem}回
                  </span>
                  <div className="text-[10px] text-indigo-400 font-bold mt-1 flex items-center justify-end gap-0.5">
                    <CheckCircle className="w-3 h-3" />
                    <span>帳消しにする</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
