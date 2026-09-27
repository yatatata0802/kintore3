import React from 'react';
import { Exercise } from '../types/workout';
import { CheckCircle2, Plus, Minus, Check, Flame, Sparkles } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface ExerciseGridProps {
  exercises: Exercise[];
  onAddReps: (exerciseId: string, delta: number) => void;
  onCompleteAll: (exerciseId: string) => void;
}

export const ExerciseGrid: React.FC<ExerciseGridProps> = ({
  exercises,
  onAddReps,
  onCompleteAll,
}) => {
  return (
    <div className="bg-neutral-900/90 border border-neutral-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col justify-between h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-lg bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Flame className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
              <span>全種目ノルマ消化リスト</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 font-normal">
                全{exercises.length}種目
              </span>
            </h3>
          </div>
        </div>
        <div className="text-[10px] text-neutral-400 font-medium">
          消化した分タップ
        </div>
      </div>

      {/* Grid of All Exercises (2 columns x 3 rows on landscape / tablet) */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-2 overflow-y-auto pr-0.5">
        {exercises.map((ex) => {
          const remaining = Math.max(0, ex.target - ex.completed);
          const isDone = ex.target > 0 && remaining === 0;
          const hasTarget = ex.target > 0;
          const progressPercent = ex.target > 0 ? Math.min(100, Math.round((ex.completed / ex.target) * 100)) : 0;

          return (
            <div
              key={ex.id}
              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between ${
                isDone
                  ? 'bg-emerald-950/40 border-emerald-500/70 shadow-sm shadow-emerald-950/30'
                  : remaining > 0
                  ? 'bg-neutral-950/90 border-amber-500/60 shadow-md shadow-amber-950/20 ring-1 ring-amber-500/30'
                  : 'bg-neutral-950/50 border-neutral-800'
              }`}
            >
              {/* Row 1: Icon, Name, Gift badge, Remaining Badge */}
              <div className="flex items-start justify-between gap-1 mb-1">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xl sm:text-2xl drop-shadow">{ex.icon}</span>
                    <span className="font-black text-sm text-white truncate" title={ex.name}>
                      {ex.name}
                    </span>
                  </div>
                  {ex.giftEmoji && ex.giftName && (
                    <div className="flex items-center gap-1 mt-0.5 ml-0.5 text-[10px] text-neutral-400 font-medium">
                      <span className="text-xs">{ex.giftEmoji}</span>
                      <span className="text-neutral-300 font-bold">{ex.giftName}</span>
                      <span>で追加</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {isDone ? (
                    <span className="flex items-center gap-1 text-[11px] font-black text-emerald-300 bg-emerald-950 px-2 py-0.5 rounded-lg border border-emerald-500/60 shadow">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      完走
                    </span>
                  ) : remaining > 0 ? (
                    <span className="text-sm font-mono font-black px-2 py-0.5 rounded-lg bg-amber-950 text-amber-300 border border-amber-500/70 shadow-inner flex items-baseline gap-0.5">
                      <span className="text-[10px] font-sans font-bold text-amber-400">残</span>
                      <span className="text-base">{remaining}</span>
                      <span className="text-[10px] font-sans">回</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-neutral-900 text-neutral-500 border border-neutral-800">
                      待機中
                    </span>
                  )}
                </div>
              </div>

              {/* Row 2: Progress bar */}
              <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden my-1 border border-neutral-800">
                <div
                  className={`h-full transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-400'
                  }`}
                  style={{ width: `${hasTarget ? progressPercent : 0}%` }}
                />
              </div>

              {/* Progress numbers */}
              <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono mb-1.5 px-0.5">
                <span>済: <b className="text-emerald-400 font-bold text-xs">{ex.completed}</b>回</span>
                {hasTarget ? (
                  <span>目: <b className="text-amber-200 font-bold text-xs">{ex.target}</b>回 ({progressPercent}%)</span>
                ) : (
                  <span className="text-neutral-500">ギフト未受信</span>
                )}
              </div>

              {/* Row 3: Action Buttons */}
              <div className="flex items-center gap-1 mt-auto pt-0.5">
                <button
                  onClick={() => {
                    onAddReps(ex.id, 1);
                    soundManager.playCountTap(480);
                  }}
                  title="1回消化"
                  className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-black text-xs border border-neutral-700 active:scale-95 transition cursor-pointer shadow-sm"
                >
                  +1
                </button>
                <button
                  onClick={() => {
                    onAddReps(ex.id, 5);
                    soundManager.playCountTap(520);
                  }}
                  title="5回消化"
                  className="flex-1 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-neutral-950 font-black text-xs active:scale-95 transition cursor-pointer shadow-sm"
                >
                  +5
                </button>
                <button
                  onClick={() => {
                    onAddReps(ex.id, 10);
                    soundManager.playCountTap(560);
                  }}
                  title="10回消化"
                  className="flex-1 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-black text-xs border border-neutral-700 active:scale-95 transition cursor-pointer shadow-sm"
                >
                  +10
                </button>
                {remaining >= 50 && (
                  <button
                    onClick={() => {
                      onAddReps(ex.id, 50);
                      soundManager.playCountTap(580);
                    }}
                    title="50回一気に消化！"
                    className="flex-1 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-600 text-white font-black text-xs border border-rose-500 active:scale-95 transition cursor-pointer shadow-sm"
                  >
                    +50
                  </button>
                )}
                {remaining > 0 && (
                  <button
                    onClick={() => {
                      onCompleteAll(ex.id);
                      soundManager.playRelief();
                    }}
                    title="残り全部消化済みにする"
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-600/70 font-black text-xs active:scale-95 transition cursor-pointer flex items-center gap-0.5 shadow-sm"
                  >
                    <Check className="w-3 h-3 stroke-[3]" />
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
                    className="px-2 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white text-xs border border-neutral-800 active:scale-95 transition cursor-pointer"
                  >
                    <Minus className="w-2.5 h-2.5" />
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
