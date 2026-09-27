import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Trophy, Gift, Flame, RotateCcw } from 'lucide-react';
import { Exercise, GiftRule } from '../types/workout';
import { formatSummaryReport, copyToClipboard } from '../utils/formatter';
import { soundManager } from '../utils/sound';

interface StreamSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  gifts: GiftRule[];
  giftCounts: Record<string, number>;
  onResetStream: () => void;
}

export const StreamSummaryModal: React.FC<StreamSummaryModalProps> = ({
  isOpen,
  onClose,
  exercises,
  gifts,
  giftCounts,
  onResetStream,
}) => {
  const [copied, setCopied] = useState<boolean>(false);
  const [reportText, setReportText] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setReportText(formatSummaryReport(exercises, gifts, giftCounts));
      setCopied(false);
      setConfirmReset(false);
    }
  }, [isOpen, exercises, gifts, giftCounts]);

  if (!isOpen) return null;

  const pushup = exercises.find((e) => e.isMainGoal || e.id === 'pushup');
  const pushupDone = pushup ? pushup.completed : 0;
  const otherExercises = exercises.filter((e) => !e.isMainGoal && e.id !== 'pushup');

  let totalRepsDone = pushupDone;
  otherExercises.forEach((e) => {
    totalRepsDone += e.completed;
  });

  let totalGiftsReceived = 0;
  Object.values(giftCounts).forEach((c) => {
    totalGiftsReceived += c;
  });

  const handleCopy = async () => {
    const ok = await copyToClipboard(reportText);
    if (ok) {
      setCopied(true);
      soundManager.playVictory();
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
      <div className="bg-neutral-900 border-2 border-amber-500/80 rounded-3xl w-full max-w-xl max-h-[92vh] flex flex-col shadow-2xl shadow-amber-950/60 overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-950/80 via-neutral-900 to-rose-950/80 border-b border-neutral-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40">
              <Trophy className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>配信終了！お疲れ様でした！</span>
              </h2>
              <p className="text-xs text-amber-300/90 font-medium">
                やった回数といただいたギフト数をまとめました
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

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          {/* Quick Stat Highlights */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3">
            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-400">
                <Flame className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <div className="text-[11px] text-neutral-400 font-bold">全種目 やった合計</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-400">
                  {totalRepsDone} <span className="text-xs font-normal text-neutral-400">回</span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-pink-500/20 text-pink-400">
                <Gift className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <div className="text-[11px] text-neutral-400 font-bold">受け取ったギフト総数</div>
                <div className="text-xl sm:text-2xl font-black font-mono text-pink-400">
                  {totalGiftsReceived} <span className="text-xs font-normal text-neutral-400">個</span>
                </div>
              </div>
            </div>
          </div>

          {/* Big Copy Action Button */}
          <button
            onClick={handleCopy}
            className={`w-full py-3.5 px-4 rounded-2xl font-black text-base sm:text-lg border-2 shadow-xl transition-all cursor-pointer active:scale-98 flex items-center justify-center gap-2 ${
              copied
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400 shadow-emerald-950/60 ring-2 ring-emerald-400/50'
                : 'bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 hover:from-amber-400 hover:to-yellow-400 text-neutral-950 border-amber-300 shadow-amber-950/50'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5 stroke-[3]" />
                <span>まとめテキストをコピーしました！</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5 stroke-[2.5]" />
                <span>まとめ結果をワンタップコピー（コピペ用）</span>
              </>
            )}
          </button>

          {/* Details breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Exercises breakdown */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
              <div className="font-extrabold text-white mb-2 pb-1 border-b border-neutral-800 flex items-center justify-between">
                <span>💪 消化した種目</span>
                <span className="text-neutral-400 font-normal">回数</span>
              </div>
              <div className="space-y-1.5 font-mono max-h-36 overflow-y-auto pr-1">
                {exercises.map((ex) => (
                  <div key={ex.id} className="flex items-center justify-between text-neutral-200">
                    <span className="font-sans flex items-center gap-1 truncate max-w-[140px]">
                      <span>{ex.icon}</span>
                      <span className="truncate">{ex.name}</span>
                    </span>
                    <span className="font-bold text-emerald-400">{ex.completed}回</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Gifts breakdown */}
            <div className="p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
              <div className="font-extrabold text-white mb-2 pb-1 border-b border-neutral-800 flex items-center justify-between">
                <span>🎁 いただいたギフト</span>
                <span className="text-neutral-400 font-normal">数量</span>
              </div>
              <div className="space-y-1.5 font-mono max-h-36 overflow-y-auto pr-1">
                {gifts.filter((g) => (giftCounts[g.id] || 0) > 0).length === 0 ? (
                  <div className="text-neutral-500 font-sans italic py-2 text-center">
                    記録されたギフトはありません
                  </div>
                ) : (
                  gifts
                    .filter((g) => (giftCounts[g.id] || 0) > 0)
                    .map((g) => (
                      <div key={g.id} className="flex items-center justify-between text-neutral-300">
                        <span className="font-sans flex items-center gap-1 truncate max-w-[140px]">
                          <span>{g.emoji}</span>
                          <span className="truncate">{g.name}</span>
                        </span>
                        <span className="font-bold text-pink-300">
                          {giftCounts[g.id]}
                          <span className="text-[10px] font-normal text-neutral-400 ml-0.5">
                            {g.defaultQuantityText?.replace(/[0-9]/g, '') || '個'}
                          </span>
                        </span>
                      </div>
                    ))
                )}
              </div>
            </div>
          </div>

          {/* Editable text preview for quick modification */}
          <div>
            <div className="text-[11px] font-bold text-neutral-400 mb-1 flex items-center justify-between">
              <span>📋 コピー用テキスト（必要に応じて追記・編集できます）</span>
              <span className="text-[10px] text-neutral-500">TikTokやSNS、コメント欄にペースト</span>
            </div>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              rows={8}
              className="w-full p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 text-neutral-200 font-mono text-xs focus:border-amber-400 outline-none resize-none leading-relaxed"
            />
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3.5 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between gap-2 shrink-0">
          <div>
            {confirmReset ? (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    onResetStream();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs cursor-pointer active:scale-95 transition"
                >
                  はい、すべて0にリセット
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="px-2 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs cursor-pointer"
                >
                  キャンセル
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 text-xs border border-neutral-800 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>次回配信へリセット</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-xs cursor-pointer active:scale-95 transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
};
