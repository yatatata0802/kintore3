import React, { useState } from 'react';
import { X, RefreshCw, Plus, Trash2, ShieldAlert, Award } from 'lucide-react';
import { Exercise, GiftRule, ActionLog } from '../types/workout';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  basePushupTarget: number;
  onUpdateBaseTarget: (newTarget: number) => void;
  onResetWorkout: () => void;
  onResetAllToDefault: () => void;
  gifts: GiftRule[];
  exercises: Exercise[];
  onAddCustomGift: (gift: GiftRule) => void;
  logs: ActionLog[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  basePushupTarget,
  onUpdateBaseTarget,
  onResetWorkout,
  onResetAllToDefault,
  gifts,
  exercises,
  onAddCustomGift,
  logs,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'add_gift' | 'logs'>('general');
  const [targetInput, setTargetInput] = useState<string>(basePushupTarget.toString());

  // New gift form state
  const [newGiftName, setNewGiftName] = useState<string>('');
  const [newGiftEmoji, setNewGiftEmoji] = useState<string>('🎁');
  const [newGiftType, setNewGiftType] = useState<'interference' | 'relief'>('interference');
  const [newGiftExercise, setNewGiftExercise] = useState<string>('pushup');
  const [newGiftDelta, setNewGiftDelta] = useState<string>('10');

  if (!isOpen) return null;

  const handleSaveBaseTarget = () => {
    const val = parseInt(targetInput, 10);
    if (!isNaN(val) && val >= 0) {
      onUpdateBaseTarget(val);
    }
  };

  const handleCreateGift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGiftName.trim()) return;

    const deltaNum = parseInt(newGiftDelta, 10) || 10;
    const finalDelta = newGiftType === 'relief' ? -Math.abs(deltaNum) : Math.abs(deltaNum);

    const targetEx = exercises.find((ex) => ex.id === newGiftExercise);
    const targetExName = targetEx ? targetEx.name : '筋トレ';

    const newGift: GiftRule = {
      id: `custom_${Date.now()}`,
      name: newGiftName.trim(),
      emoji: newGiftEmoji || '🎁',
      type: newGiftType === 'relief' ? 'relief' : (newGiftExercise === 'pushup' ? 'pushup_penalty' : 'interference'),
      description: `${targetExName} ${finalDelta > 0 ? `+${finalDelta}` : finalDelta}回`,
      targetExerciseId: newGiftExercise,
      repsDelta: finalDelta,
      colorTheme: newGiftType === 'relief' ? 'from-emerald-600 to-teal-800' : 'from-pink-600 to-rose-800',
    };

    onAddCustomGift(newGift);
    setNewGiftName('');
    setActiveTab('general');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-neutral-900 border border-neutral-700 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          <h2 className="font-extrabold text-base sm:text-lg text-white flex items-center gap-2">
            ⚙️ 配信設定・ギフト管理
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-800 bg-neutral-950/60 px-4">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'general'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            基本ルール・リセット
          </button>
          <button
            onClick={() => setActiveTab('add_gift')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'add_gift'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            ＋ ギフト追加
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2.5 px-3 text-xs font-bold border-b-2 cursor-pointer transition ${
              activeTab === 'logs'
                ? 'border-red-500 text-red-400'
                : 'border-transparent text-neutral-400 hover:text-neutral-200'
            }`}
          >
            操作ログ ({logs.length})
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-neutral-200">
          {activeTab === 'general' && (
            <div className="space-y-4">
              {/* Pushup Base Target */}
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800">
                <div className="font-bold text-white mb-1">無条件 腕立て目標数</div>
                <div className="text-xs text-neutral-400 mb-2">
                  デフォルトは「500回」です。配信に合わせて変更できます。
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={targetInput}
                    onChange={(e) => setTargetInput(e.target.value)}
                    className="w-28 px-3 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white font-mono font-bold text-sm"
                  />
                  <button
                    onClick={handleSaveBaseTarget}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg cursor-pointer transition"
                  >
                    設定保存
                  </button>
                </div>
              </div>

              {/* Reset Session */}
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  <span>カウンターのリセット</span>
                </div>
                <div className="text-xs text-neutral-400">
                  配信枠の開始前やテスト後にカウントをゼロに戻します。
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => {
                      if (confirm('現在のカウント実績と妨害ノルマを0にリセットしますか？')) {
                        onResetWorkout();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg font-bold text-xs border border-neutral-700 cursor-pointer transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>回数のみゼロリセット（腕立て500回開始）</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm('すべてのギフト設定・種目を初期状態に戻しますか？')) {
                        onResetAllToDefault();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 bg-red-950 hover:bg-red-900 text-red-300 rounded-lg font-bold text-xs border border-red-800 cursor-pointer transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>初期設定へ完全初期化</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add_gift' && (
            <form onSubmit={handleCreateGift} className="space-y-3">
              <div className="bg-neutral-950 p-3.5 rounded-xl border border-neutral-800 space-y-3">
                <div className="font-bold text-white mb-1">新しいギフトを登録</div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">ギフト名</label>
                    <input
                      type="text"
                      placeholder="例: ライオン, 銀河"
                      value={newGiftName}
                      onChange={(e) => setNewGiftName(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">絵文字 / アイコン</label>
                    <input
                      type="text"
                      value={newGiftEmoji}
                      onChange={(e) => setNewGiftEmoji(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">ギフトの性質</label>
                    <select
                      value={newGiftType}
                      onChange={(e) => setNewGiftType(e.target.value as 'interference' | 'relief')}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs cursor-pointer"
                    >
                      <option value="interference">妨害ギフト（回数追加）</option>
                      <option value="relief">救済ギフト（回数免除・減少）</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-neutral-400 block mb-1">連動する筋トレ種目</label>
                    <select
                      value={newGiftExercise}
                      onChange={(e) => setNewGiftExercise(e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs cursor-pointer"
                    >
                      {exercises.map((ex) => (
                        <option key={ex.id} value={ex.id}>
                          {ex.icon} {ex.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">1回あたりの増減回数</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newGiftDelta}
                    onChange={(e) => setNewGiftDelta(e.target.value)}
                    className="w-32 px-2.5 py-1.5 rounded-lg bg-neutral-900 border border-neutral-700 text-white text-xs font-mono font-bold"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-bold rounded-lg cursor-pointer transition mt-2"
                >
                  ギフトをパネルに追加する
                </button>
              </div>
            </form>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-xs text-neutral-400 mb-2">
                直近のギフト受信や消化履歴（最大30件）
              </div>
              {logs.length === 0 ? (
                <div className="text-center py-8 text-neutral-500">まだ履歴はありません</div>
              ) : (
                <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-white mr-2">{log.title}</span>
                        <span className="text-neutral-400">{log.details}</span>
                      </div>
                      <span className="text-[10px] text-neutral-500 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
