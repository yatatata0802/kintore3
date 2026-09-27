import React, { useState } from 'react';
import { Copy, Check, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { Exercise } from '../types/workout';
import { formatRemainingText, formatCompletedText } from '../utils/formatter';

interface CopyBarProps {
  exercises: Exercise[];
  onCopyText: (text: string, type: 'remaining' | 'completed') => void;
  copiedType: 'remaining' | 'completed' | null;
}

export const CopyBar: React.FC<CopyBarProps> = ({
  exercises,
  onCopyText,
  copiedType,
}) => {
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [previewTab, setPreviewTab] = useState<'remaining' | 'completed'>('remaining');

  const pushup = exercises.find((e) => e.isMainGoal || e.id === 'pushup');
  const pushupRemaining = pushup ? Math.max(0, pushup.target - pushup.completed) : 0;
  const pushupCompleted = pushup ? pushup.completed : 0;

  const remainingText = formatRemainingText(exercises);
  const completedText = formatCompletedText(exercises);

  const handleCopy = (type: 'remaining' | 'completed') => {
    onCopyText(type === 'remaining' ? remainingText : completedText, type);
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-2.5 sm:p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-amber-400" />
          <span className="font-extrabold text-white text-xs sm:text-sm">
            クリップボード即時コピー
          </span>
          <span className="text-[10px] text-neutral-400 hidden sm:inline">
            （配信コメント・固定コメント・SNS投稿用）
          </span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">
          {/* コピーボタン（残り回数） */}
          <button
            onClick={() => handleCopy('remaining')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border transition cursor-pointer active:scale-95 ${
              copiedType === 'remaining'
                ? 'bg-rose-600 text-white border-rose-400 shadow'
                : 'bg-rose-950/80 hover:bg-rose-900 text-rose-200 border-rose-700/60'
            }`}
          >
            {copiedType === 'remaining' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>コピー（残り、腕立て{pushupRemaining}回）</span>
          </button>

          {/* 現在の回数ボタン（やった実績） */}
          <button
            onClick={() => handleCopy('completed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold border transition cursor-pointer active:scale-95 ${
              copiedType === 'completed'
                ? 'bg-emerald-600 text-white border-emerald-400 shadow'
                : 'bg-emerald-950/80 hover:bg-emerald-900 text-emerald-200 border-emerald-700/60'
            }`}
          >
            {copiedType === 'completed' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>現在の回数（やった実績 {pushupCompleted}回）</span>
          </button>

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition cursor-pointer"
            title="コピー内容をプレビュー"
          >
            {showPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Text preview expandable area */}
      {showPreview && (
        <div className="mt-2.5 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2 mb-1.5">
            <button
              onClick={() => setPreviewTab('remaining')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                previewTab === 'remaining'
                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              「残り」コピー内容プレビュー
            </button>
            <button
              onClick={() => setPreviewTab('completed')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                previewTab === 'completed'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              「やった実績」コピー内容プレビュー
            </button>
          </div>
          <pre className="bg-neutral-950 p-2.5 rounded-lg text-neutral-300 font-mono text-[11px] whitespace-pre overflow-x-auto border border-neutral-800 max-h-36">
            {previewTab === 'remaining' ? remainingText : completedText}
          </pre>
        </div>
      )}
    </div>
  );
};
