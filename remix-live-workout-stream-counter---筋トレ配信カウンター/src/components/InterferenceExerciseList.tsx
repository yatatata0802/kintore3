import React from 'react';
import { Exercise } from '../types/workout';
import { CheckCircle2, Plus, Minus, Check, Flame } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface InterferenceExerciseListProps {
  exercises: Exercise[];
  onAddReps: (exerciseId: string, delta: number) => void;
  onCompleteAll: (exerciseId: string) => void;
}

export const InterferenceExerciseList: React.FC<InterferenceExerciseListProps> = ({
  exercises,
  onAddReps,
  onCompleteAll,
}) => {
  // Only display sub-exercises (non-mainGoal)
  const subExercises = exercises.filter((e) => !e.isMainGoal && e.id !== 'pushup');

  return (
    <div className="bg-neutral-900/90 border border-neutral-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col justify-between h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-neutral-800">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1">
              <span>妨害種目ノルマ消化</span>
            </h3>
          </div>
        </div>
        <div className="text-[10px] text-neutral-400">
          やった分タップ
        </div>
      </div>

      {/* Vertical Stack List (fits 4 exercises nicely in right column) */}
      <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto pr-0.5">
        {subExercises.map((ex) => {
          const remaining = Math.max(0, ex.target - ex.completed);
          const isDone = ex.target > 0 && remaining === 0;
          const hasTarget = ex.target > 0;
          const progressPercent = ex.target > 0 ? Math.min(100, Math.round((ex.completed / ex.target) * 100)) : 0;

          return (
            <div
              key={ex.id}
              className={`p-2 rounded-xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/60 shadow-sm'
                  : hasTarget
                  ? 'bg-neutral-950/80 border-neutral-700 hover:border-neutral-600'
                  : 'bg-neutral-950/30 border-neutral-850 opacity-60'
              }`}
            >
              {/* Row 1: Icon, Name, Remaining Badge */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-base sm:text-lg">{ex.icon}</span>
                  <span className="font-extrabold text-xs text-white truncate max-w-[120px]" title={ex.name}>
                    {ex.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {isDone ? (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-500/50">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      完
                    </span>
                  ) : (
                    <span
                      className={`text-xs font-mono font-black px-1.5 py-0.5 rounded ${
                        remaining > 0
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-600/50'
                          : 'bg-neutral-800 text-neutral-400'
                      }`}
                    >
                      残{remaining}回
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Progress bar & numbers */}
              <div className="w-full bg-neutral-800 rounded-full h-1 overflow-hidden my-1">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDone ? 'bg-emerald-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                  }`}
                  style={{ width: `${hasTarget ? progressPercent : 0}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono mb-1.5">
                <span>済: <b className="text-white font-bold">{ex.completed}</b></span>
                <span>目: <b className="text-neutral-300 font-bold">{ex.target}</b>回</span>
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex items-center gap-1 mt-auto">
                <button
                  onClick={() => {
                    onAddReps(ex.id, 1);
                    soundManager.playCountTap(480);
                  }}
                  title="1回消化"
                  className="flex-1 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[10px] border border-neutral-700 active:scale-95 transition cursor-pointer"
                >
                  +1
                </button>
                <button
                  onClick={() => {
                    onAddReps(ex.id, 5);
                    soundManager.playCountTap(520);
                  }}
                  title="5回消化"
                  className="flex-1 py-1 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-neutral-950 font-black text-[10px] active:scale-95 transition cursor-pointer"
                >
                  +5
                </button>
                {remaining > 5 && (
                  <button
                    onClick={() => {
                      onAddReps(ex.id, 10);
                      soundManager.playCountTap(560);
                    }}
                    title="10回消化"
                    className="flex-1 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-bold text-[10px] border border-neutral-700 active:scale-95 transition cursor-pointer"
                  >
                    +10
                  </button>
                )}
                {remaining > 0 && (
                  <button
                    onClick={() => {
                      onCompleteAll(ex.id);
                      soundManager.playRelief();
                    }}
                    title="残り全部消化済みにする"
                    className="px-2 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 font-bold text-[9px] active:scale-95 transition cursor-pointer flex items-center gap-0.5"
                  >
                    <Check className="w-2.5 h-2.5" />
                    完
                  </button>
                )}
                {ex.completed > 0 && (
                  <button
                    onClick={() => {
                      onAddReps(ex.id, -1);
                      soundManager.playCountTap(300);
                    }}
                    title="1回減らす（修正）"
                    className="px-1.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 text-neutral-400 text-[9px] active:scale-95 transition cursor-pointer"
                  >
                    <Minus className="w-2 h-2" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
