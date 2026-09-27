import React from 'react';
import { X, Sparkles, Dog, ArrowDownRight, CheckCircle } from 'lucide-react';
import { Exercise } from '../types/workout';

interface CorgiSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeExercises: Exercise[];
  reductionReps: number;
  corgiCount: number;
  onSelectExercise: (exercise: Exercise) => void;
}

export const CorgiSelectModal: React.FC<CorgiSelectModalProps> = ({
  isOpen,
  onClose,
  activeExercises,
  reductionReps,
  corgiCount,
  onSelectExercise,
}) => {
  if (!isOpen) return null;

  // Sort by remaining reps descending so biggest burden is first
  const sorted = [...activeExercises].sort(
    (a, b) => (b.target - b.completed) - (a.target - a.completed)
  );
  const maxRemainingEx = sorted[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm select-none">
      <div className="bg-neutral-900 border-2 border-amber-400 rounded-3xl w-full max-w-md p-4 sm:p-5 shadow-2xl shadow-amber-950/60 flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <span className="text-3xl drop-shadow">🐶🐾</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">コーギー救済発動！</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-black font-mono bg-amber-500/20 text-amber-300 border border-amber-400/50">
                  -{reductionReps}回
                </span>
              </div>
              <p className="text-xs text-amber-300/90 font-bold">
                コーギー{corgiCount}個で、いずれかの種目をマイナス{reductionReps}回免除！
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-neutral-300 font-medium">
          マイナス{reductionReps}回（ノルマ免除）したい種目を1つ選んでください：
        </p>

        {/* Quick auto-pick: Highest remaining reps */}
        {maxRemainingEx && sorted.length > 1 && (
          <button
            onClick={() => onSelectExercise(maxRemainingEx)}
            className="p-3 rounded-2xl bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 hover:from-amber-500 hover:to-yellow-400 text-neutral-950 font-black text-xs sm:text-sm border border-amber-300 shadow-lg flex items-center justify-between cursor-pointer active:scale-95 transition"
          >
            <span className="flex items-center gap-1.5 font-black">
              <Sparkles className="w-4 h-4 text-neutral-900" />
              <span>一番残りの多い種目を -{reductionReps}回</span>
            </span>
            <span className="bg-black/25 px-2 py-1 rounded-lg text-xs font-mono font-bold text-neutral-900 flex items-center gap-1">
              <span>{maxRemainingEx.name}</span>
              <span className="text-neutral-950 font-black font-mono">
                (残{Math.max(0, maxRemainingEx.target - maxRemainingEx.completed)}回 → {Math.max(0, maxRemainingEx.target - maxRemainingEx.completed - reductionReps)}回)
              </span>
            </span>
          </button>
        )}

        {/* List of exercises with remaining reps */}
        <div className="grid grid-cols-1 gap-2 max-h-64 overflow-y-auto pr-0.5">
          {sorted.map((ex) => {
            const currentRem = Math.max(0, ex.target - ex.completed);
            const actualDeduct = Math.min(currentRem, reductionReps);
            const newRem = Math.max(0, currentRem - reductionReps);

            return (
              <button
                key={ex.id}
                onClick={() => onSelectExercise(ex)}
                className="p-3 rounded-2xl bg-neutral-950 hover:bg-amber-950/40 border border-neutral-750 hover:border-amber-400 text-left flex items-center justify-between group cursor-pointer active:scale-98 transition shadow-sm"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-2xl sm:text-3xl shrink-0">{ex.icon}</span>
                  <div className="min-w-0">
                    <div className="font-black text-sm text-white group-hover:text-amber-300 transition truncate">
                      {ex.name}
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                      済: {ex.completed}回 / 目標: {ex.target}回
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <div className="flex items-center justify-end gap-1.5 font-mono">
                    <span className="text-xs text-neutral-400 line-through">
                      残{currentRem}
                    </span>
                    <ArrowDownRight className="w-3.5 h-3.5 text-amber-400 stroke-[3]" />
                    <span className="text-sm font-black text-emerald-400 bg-neutral-900 px-2 py-0.5 rounded-md border border-neutral-750">
                      残{newRem}回
                    </span>
                  </div>
                  <div className="text-[11px] text-amber-400 font-bold mt-1 flex items-center justify-end gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>-{actualDeduct}回 減算する</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer info */}
        <div className="pt-2 border-t border-neutral-800 text-center text-[11px] text-neutral-400">
          🐶 コーギー1匹で任意の種目 -10回消化免除！
        </div>
      </div>
    </div>
  );
};
