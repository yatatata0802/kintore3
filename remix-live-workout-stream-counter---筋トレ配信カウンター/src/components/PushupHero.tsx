import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Copy, CheckCircle, Flame, Plus, Minus, ArrowUpRight, Sparkles } from 'lucide-react';
import { Exercise } from '../types/workout';
import { soundManager } from '../utils/sound';

interface PushupHeroProps {
  pushup: Exercise;
  baseTarget: number;
  rosieModifier: number; // accumulated +50s
  moneyGunModifier: number; // accumulated -50s
  onAddPushup: (count: number) => void;
  onCopyRemaining: () => void;
  onCopyCompleted: () => void;
  copiedType: 'remaining' | 'completed' | null;
}

export const PushupHero: React.FC<PushupHeroProps> = ({
  pushup,
  baseTarget,
  rosieModifier,
  moneyGunModifier,
  onAddPushup,
  onCopyRemaining,
  onCopyCompleted,
  copiedType,
}) => {
  const currentTarget = Math.max(0, pushup.target);
  const completed = pushup.completed;
  const remaining = Math.max(0, currentTarget - completed);
  const isCleared = completed >= currentTarget && currentTarget > 0;
  const progressPercent = currentTarget > 0 ? Math.min(100, Math.round((completed / currentTarget) * 100)) : 100;

  return (
    <div className={`relative flex flex-col justify-between h-full rounded-2xl border p-3 sm:p-3.5 transition-all shadow-xl overflow-hidden ${
      isCleared
        ? 'bg-gradient-to-br from-emerald-950/80 via-neutral-900 to-emerald-900/40 border-emerald-500 shadow-emerald-950/50'
        : 'bg-neutral-900/90 border-neutral-700/80'
    }`}>
      {/* Background glow badge */}
      {isCleared && (
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-400/50 rounded-full text-[11px] font-black animate-bounce z-10">
          <Trophy className="w-3.5 h-3.5 text-amber-300" />
          <span>俺の勝ち！500達成！</span>
        </div>
      )}

      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className="text-xl sm:text-2xl">💪</span>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base sm:text-lg font-black text-white tracking-wide">
                  腕立て伏せ
                </h2>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-red-950 text-red-300 border border-red-800 font-bold">
                  基本500回
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-tight">
                腕立て500回達成で勝利！
              </p>
            </div>
          </div>
        </div>

        {/* Big Remaining Display */}
        <div className="p-2 sm:p-2.5 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-col items-center justify-center relative overflow-hidden">
          {/* Subtle background progress bar */}
          <div
            className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-red-600 via-amber-500 to-emerald-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />

          <div className="flex items-center justify-between w-full text-[10px] text-neutral-400 px-1 mb-0.5 font-semibold">
            <span className="flex items-center gap-1 text-rose-400 font-bold">
              <Flame className="w-3 h-3 text-rose-500" />
              残りノルマ
            </span>
            <span>達成度: {progressPercent}%</span>
          </div>

          {/* Huge Number */}
          <div className="flex items-baseline gap-1.5 font-mono my-0.5">
            <span className="text-xs font-sans font-bold text-neutral-400">残り</span>
            <span className={`text-4xl sm:text-5xl font-black tracking-tight ${
              isCleared ? 'text-emerald-400' : 'text-rose-500 drop-shadow-[0_0_12px_rgba(244,63,94,0.3)]'
            }`}>
              {remaining}
            </span>
            <span className="text-base font-sans font-bold text-neutral-300">回</span>
          </div>

          {/* Target Breakdown pills */}
          <div className="flex flex-wrap items-center justify-center gap-1 text-[10px] text-neutral-300">
            <span className="bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
              やった: <b className="text-emerald-400 font-mono">{completed}</b>回
            </span>
            <span className="text-neutral-500">/</span>
            <span className="bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-800">
              目標: <b className="text-white font-mono">{currentTarget}</b>回
            </span>

            {(rosieModifier > 0 || moneyGunModifier > 0) && (
              <span className="text-[9px] text-neutral-400 bg-neutral-900/60 px-1 py-0.5 rounded">
                ({baseTarget}
                {rosieModifier > 0 && <span className="text-rose-400">+{rosieModifier}</span>}
                {moneyGunModifier > 0 && <span className="text-emerald-400">-{moneyGunModifier}</span>})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Quick Count Add Buttons - Designed for 50 reps per set */}
      <div className="my-1.5">
        <div className="text-[10px] font-bold text-neutral-400 mb-1 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <span className="text-amber-400 font-black">【基本 50回ずつ】</span>
            <span>消化カウント</span>
          </span>
          <span className="text-[9px] text-neutral-500">押し間違いは修正</span>
        </div>

        {/* Big Main Button for +50 reps (Primary Action) */}
        <button
          onClick={() => {
            onAddPushup(50);
            soundManager.playCountTap(580);
          }}
          className="w-full mb-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-red-500 hover:from-red-500 hover:to-rose-400 text-white font-black text-base sm:text-lg border-2 border-red-400/80 shadow-lg shadow-red-950/60 active:scale-[0.98] transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>腕立て 50回 達成！</span>
          <span className="text-[10px] bg-black/30 px-1.5 py-0.5 rounded font-normal text-rose-100">（1セット完了）</span>
        </button>

        {/* Secondary quick buttons: +1, +5, +10, +25 */}
        <div className="grid grid-cols-4 gap-1">
          {[1, 5, 10, 25].map((num) => (
            <button
              key={num}
              onClick={() => {
                onAddPushup(num);
                soundManager.playCountTap(440 + num * 6);
              }}
              className="py-1.5 px-1 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-white font-black text-xs border border-neutral-700 active:scale-95 transition cursor-pointer flex flex-col items-center justify-center leading-none"
            >
              <span className="flex items-center gap-0.5">
                <Plus className="w-2.5 h-2.5 stroke-[3]" />
                {num}
              </span>
              <span className="text-[8px] font-normal text-neutral-400 mt-0.5">回</span>
            </button>
          ))}
        </div>

        {/* Minus adjustments for mis-taps: -50, -10, -5, -1 */}
        <div className="flex items-center justify-end gap-1 mt-1">
          <span className="text-[9px] text-neutral-500">修正:</span>
          {[-50, -10, -5, -1].map((num) => (
            <button
              key={num}
              disabled={completed === 0}
              onClick={() => {
                onAddPushup(num);
                soundManager.playCountTap(300);
              }}
              className="px-1.5 py-0.5 rounded bg-neutral-850 hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 text-[10px] font-mono border border-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer active:scale-95 transition"
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Copy Buttons: The requested "コピー" & "現在の回数" (やった実績) */}
      <div className="pt-2 border-t border-neutral-800">
        <div className="text-[10px] font-bold text-neutral-400 mb-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>コメント用 ワンタップコピー</span>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {/* Button 1: 残り回数コピー */}
          <button
            onClick={onCopyRemaining}
            className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border font-bold text-xs transition cursor-pointer active:scale-95 ${
              copiedType === 'remaining'
                ? 'bg-rose-600 text-white border-rose-400 ring-2 ring-rose-400/40'
                : 'bg-rose-950/70 hover:bg-rose-900/90 text-rose-200 border-rose-700/60 shadow-md'
            }`}
          >
            {copiedType === 'remaining' ? (
              <CheckCircle className="w-3.5 h-3.5 text-rose-200 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            )}
            <div className="text-left leading-tight min-w-0">
              <div className="truncate">残り回数コピー</div>
              <div className="text-[9px] font-normal opacity-80 truncate">残り、腕立て◯回</div>
            </div>
          </button>

          {/* Button 2: 現在の回数（やった実績）コピー */}
          <button
            onClick={onCopyCompleted}
            className={`flex items-center justify-center gap-1 py-2 px-1.5 rounded-xl border font-bold text-xs transition cursor-pointer active:scale-95 ${
              copiedType === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-400/40'
                : 'bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-200 border-emerald-700/60 shadow-md'
            }`}
          >
            {copiedType === 'completed' ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-200 shrink-0" />
            ) : (
              <Copy className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            )}
            <div className="text-left leading-tight min-w-0">
              <div className="truncate">実績をコピー</div>
              <div className="text-[9px] font-normal opacity-80 truncate">やった実績◯回</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
