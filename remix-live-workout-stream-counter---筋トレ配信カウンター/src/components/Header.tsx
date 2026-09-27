import React from 'react';
import { Volume2, VolumeX, RotateCcw, Settings, Monitor, ShieldCheck, Zap } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface HeaderProps {
  totalCompleted: number;
  totalRemaining: number;
  pushupRemaining: number;
  historyLength: number;
  isSoundEnabled: boolean;
  isWakeLockActive: boolean;
  onToggleSound: () => void;
  onToggleWakeLock: () => void;
  onUndo: () => void;
  onOpenSettings: () => void;
  onOpenOverlay: () => void;
  onOpenSummary: () => void;
  onQuickCopyRemaining: () => void;
  onQuickCopyCompleted: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalCompleted,
  totalRemaining,
  pushupRemaining,
  historyLength,
  isSoundEnabled,
  isWakeLockActive,
  onToggleSound,
  onToggleWakeLock,
  onUndo,
  onOpenSettings,
  onOpenOverlay,
  onOpenSummary,
  onQuickCopyRemaining,
  onQuickCopyCompleted,
}) => {
  return (
    <header className="bg-neutral-900/90 border-b border-neutral-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0">
      {/* Title & Live Status */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
          </span>
          <h1 className="font-extrabold text-base lg:text-lg tracking-tight text-white flex items-center gap-1.5">
            <span className="text-red-500">🔥 筋トレ配信</span>
            <span className="text-neutral-300">耐久バトル</span>
          </h1>
        </div>

        {/* Win/Progress condition badge */}
        <div className="hidden md:flex items-center gap-1.5 bg-neutral-800/80 px-2.5 py-1 rounded-full text-xs font-semibold border border-neutral-700">
          <Zap className="w-3.5 h-3.5 text-amber-400" />
          {totalRemaining <= 0 ? (
            <span className="text-emerald-400 font-bold">🎉 全種目ノルマ消化完了！俺の勝ち！</span>
          ) : (
            <span className="text-neutral-300">
              全種目ノルマ消化で<span className="text-amber-400 font-bold">俺の勝ち</span>（残り合計<span className="text-rose-400 font-mono font-bold"> {totalRemaining}</span>回）
            </span>
          )}
        </div>
      </div>

      {/* Center Highlights: Total Done & Remaining */}
      <div className="flex items-center gap-3 bg-neutral-950/80 px-3 py-1 rounded-xl border border-neutral-800">
        <div className="text-center">
          <div className="text-[10px] text-neutral-400 font-semibold uppercase">これまでやった合計</div>
          <div className="text-base lg:text-lg font-black font-mono text-emerald-400 leading-none">
            {totalCompleted}<span className="text-xs font-normal text-neutral-400 ml-0.5">回</span>
          </div>
        </div>
        <div className="h-6 w-px bg-neutral-800" />
        <div className="text-center">
          <div className="text-[10px] text-neutral-400 font-semibold uppercase">全種目残り</div>
          <div className="text-base lg:text-lg font-black font-mono text-rose-400 leading-none">
            {totalRemaining}<span className="text-xs font-normal text-neutral-400 ml-0.5">回</span>
          </div>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Quick Copy Buttons in Header (Desktop / iPad) */}
        <button
          onClick={onQuickCopyRemaining}
          title="残り回数をコピー"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 rounded-lg text-xs font-bold text-rose-200 transition active:scale-95 cursor-pointer"
        >
          📋 残りコピー
        </button>
        <button
          onClick={onQuickCopyCompleted}
          title="やった実績をコピー"
          className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 rounded-lg text-xs font-bold text-emerald-200 transition active:scale-95 cursor-pointer"
        >
          📋 やった実績コピー
        </button>

        {/* Undo button */}
        <button
          onClick={onUndo}
          disabled={historyLength === 0}
          title="直前の操作を1つ戻す (Undo)"
          className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition ${
            historyLength > 0
              ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700 cursor-pointer active:scale-95'
              : 'bg-neutral-900 text-neutral-600 border-neutral-800 cursor-not-allowed'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden md:inline">戻す</span>
        </button>

        {/* Sound Toggle */}
        <button
          onClick={() => {
            onToggleSound();
            soundManager.playCountTap();
          }}
          title={isSoundEnabled ? '効果音: ON' : '効果音: OFF'}
          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer active:scale-95 ${
            isSoundEnabled
              ? 'bg-neutral-800 text-amber-400 border-neutral-700 hover:bg-neutral-700'
              : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:bg-neutral-850'
          }`}
        >
          {isSoundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Wake Lock */}
        <button
          onClick={onToggleWakeLock}
          title={isWakeLockActive ? '画面スリープ防止: ON' : '画面スリープ防止: OFF'}
          className={`hidden sm:flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer active:scale-95 ${
            isWakeLockActive
              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
              : 'bg-neutral-800 text-neutral-400 border-neutral-700 hover:bg-neutral-700'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">{isWakeLockActive ? '常時点灯ON' : '点灯維持'}</span>
        </button>

        {/* Stream OBS Overlay Mode */}
        <button
          onClick={onOpenOverlay}
          title="配信画面・OBS用オーバーレイ表示"
          className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-950/70 hover:bg-blue-900 border border-blue-700/60 rounded-lg text-xs font-semibold text-blue-200 transition active:scale-95 cursor-pointer"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span className="hidden md:inline">配信HUD</span>
        </button>

        {/* 終了（結果まとめ＆コピペ）ボタン */}
        <button
          onClick={onOpenSummary}
          title="配信終了（やった回数とギフト数をまとめてコピー）"
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-neutral-950 font-black rounded-lg text-xs shadow-md border border-amber-300 transition active:scale-95 cursor-pointer"
        >
          <span>🏁 終了</span>
        </button>

        {/* Settings */}
        <button
          onClick={onOpenSettings}
          title="設定・リセット"
          className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg transition active:scale-95 cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
