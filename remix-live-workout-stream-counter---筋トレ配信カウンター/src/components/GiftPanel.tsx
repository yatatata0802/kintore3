import React, { useState } from 'react';
import { GiftRule } from '../types/workout';
import { Gift, Zap, Shield, Flame, Plus } from 'lucide-react';
import { soundManager } from '../utils/sound';

interface GiftPanelProps {
  gifts: GiftRule[];
  onTriggerGift: (gift: GiftRule, multiplier: number) => void;
  onOpenCustomGiftModal: () => void;
}

export const GiftPanel: React.FC<GiftPanelProps> = ({
  gifts,
  onTriggerGift,
  onOpenCustomGiftModal,
}) => {
  const [multiplier, setMultiplier] = useState<number>(1);
  const [customMultiInput, setCustomMultiInput] = useState<string>('');
  const [showCustomMulti, setShowCustomMulti] = useState<boolean>(false);

  const multipliers = [1, 5, 10, 50, 100];

  const handleGiftClick = (gift: GiftRule, specificMultiplier?: number) => {
    const multi = specificMultiplier !== undefined ? specificMultiplier : multiplier;
    // Play appropriate sound
    if (gift.type === 'relief' || gift.type === 'clear_one_sub' || gift.type === 'clear_all_sub') {
      soundManager.playRelief();
    } else {
      soundManager.playInterference();
    }
    onTriggerGift(gift, multi);
  };

  const applyCustomMultiplier = () => {
    const val = parseInt(customMultiInput, 10);
    if (!isNaN(val) && val > 0) {
      setMultiplier(val);
      setShowCustomMulti(false);
    }
  };

  return (
    <div className="bg-neutral-900/90 border border-neutral-700/80 rounded-2xl p-2.5 sm:p-3 shadow-xl flex flex-col justify-between h-full overflow-hidden">
      {/* Panel Header & Multiplier row */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-1.5 mb-1.5">
          <div className="flex items-center gap-1.5">
            <div className="p-1 rounded-lg bg-pink-500/20 text-pink-400 border border-pink-500/30">
              <Gift className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1">
                <span>ギフト即押しパネル</span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 font-normal">
                  届いたら即タップ
                </span>
              </h3>
            </div>
          </div>

          {/* Multiplier pills */}
          <div className="flex items-center gap-0.5 bg-neutral-950/80 p-0.5 rounded-lg border border-neutral-800">
            <span className="text-[9px] text-neutral-400 font-semibold px-1">倍率:</span>
            {multipliers.map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMultiplier(m);
                  soundManager.playCountTap(350 + m * 15);
                }}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-bold transition cursor-pointer ${
                  multiplier === m
                    ? 'bg-amber-500 text-neutral-950 shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                }`}
              >
                ×{m}
              </button>
            ))}
            <button
              onClick={() => setShowCustomMulti(!showCustomMulti)}
              className={`px-1 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                showCustomMulti
                  ? 'bg-neutral-700 text-white border-neutral-600'
                  : 'text-neutral-400 border-neutral-800 hover:bg-neutral-800'
              }`}
            >
              自由
            </button>
          </div>
        </div>

        {/* Custom Multiplier drawer if opened */}
        {showCustomMulti && (
          <div className="mb-2 p-1.5 bg-neutral-950 rounded-xl border border-amber-500/40 flex items-center gap-1.5">
            <span className="text-[10px] text-amber-300 font-bold whitespace-nowrap">個数指定:</span>
            <input
              type="number"
              min="1"
              max="999"
              placeholder="例: 100"
              value={customMultiInput}
              onChange={(e) => setCustomMultiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyCustomMultiplier()}
              className="w-20 px-1.5 py-0.5 rounded bg-neutral-800 text-white font-mono text-xs border border-neutral-700 outline-none focus:border-amber-400"
            />
            <button
              onClick={applyCustomMultiplier}
              className="px-2 py-0.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-[10px] rounded transition cursor-pointer"
            >
              セット
            </button>
          </div>
        )}
      </div>

      {/* Gift Grid - 2 columns grid to fit middle column vertically */}
      <div className="grid grid-cols-2 gap-2 flex-1 overflow-y-auto pr-0.5">
        {gifts.map((gift) => {
          const isRelief = gift.type === 'relief' || gift.type === 'clear_one_sub' || gift.type === 'clear_all_sub';
          const isGalaxy = gift.id === 'galaxy' || gift.type === 'clear_one_sub';
          const isFuture = gift.id === 'encounter_with_future' || gift.type === 'clear_all_sub';
          const isDaisuki = gift.id === 'daisuki';
          const isSwan = gift.id === 'swan';
          const isCrab = gift.id === 'cheering_crab';
          const isBirdKiss = gift.id === 'bird_kiss';
          const isCorgi = gift.id === 'corgi';
          const isRose = gift.id === 'rose';
          const isSpecialClear = isGalaxy || isFuture;

          return (
            <div
              key={gift.id}
              className={`p-2 rounded-xl border text-left transition-all shadow-md flex flex-col justify-between ${
                isFuture
                  ? 'bg-gradient-to-br from-cyan-950/90 via-sky-900/60 to-blue-950/80 border-cyan-400 ring-1 ring-cyan-400/40'
                  : isGalaxy
                  ? 'bg-gradient-to-br from-indigo-950/90 via-purple-900/60 to-violet-950/80 border-indigo-400 ring-1 ring-indigo-400/40'
                  : isDaisuki
                  ? 'bg-gradient-to-br from-rose-950/80 via-pink-900/50 to-neutral-900 border-rose-400 ring-1 ring-rose-400/40'
                  : isSwan
                  ? 'bg-gradient-to-br from-indigo-950/90 via-purple-900/60 to-slate-900 border-indigo-400 ring-1 ring-indigo-400/40'
                  : isCorgi
                  ? 'bg-gradient-to-br from-amber-950/80 via-yellow-950/50 to-neutral-900 border-amber-400'
                  : isCrab
                  ? 'bg-gradient-to-br from-orange-950/80 to-neutral-900 border-orange-500/80'
                  : isBirdKiss
                  ? 'bg-gradient-to-br from-sky-950/80 to-neutral-900 border-sky-500/80'
                  : isRose
                  ? 'bg-gradient-to-br from-pink-950/80 to-neutral-900 border-pink-500/80'
                  : isRelief
                  ? 'bg-gradient-to-br from-emerald-950/90 to-teal-900/60 border-emerald-500/70'
                  : 'bg-neutral-850 hover:bg-neutral-800 border-neutral-700'
              }`}
            >
              {/* Main Gift Info Clickable Header */}
              <div
                onClick={() => handleGiftClick(gift)}
                className="cursor-pointer active:scale-98 transition group flex-1 pb-1"
                title={`${gift.name} を ${multiplier}個 送信`}
              >
                {/* Type pill & Emoji */}
                <div className="flex items-center justify-between gap-1 w-full mb-0.5">
                  <span className="text-xl sm:text-2xl drop-shadow">{gift.emoji}</span>
                  <span
                    className={`text-[8px] sm:text-[9px] px-1 py-0.2 rounded-full font-bold uppercase tracking-wider flex items-center gap-0.5 ${
                      isFuture
                        ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/60 animate-pulse'
                        : isGalaxy
                        ? 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/60'
                        : isDaisuki
                        ? 'bg-rose-400/25 text-rose-300 border border-rose-400/60 font-black'
                        : isSwan
                        ? 'bg-indigo-400/20 text-indigo-300 border border-indigo-400/50'
                        : isCorgi
                        ? 'bg-amber-400/20 text-amber-300 border border-amber-400/50'
                        : isCrab
                        ? 'bg-orange-400/20 text-orange-300 border border-orange-400/50'
                        : isBirdKiss
                        ? 'bg-sky-400/20 text-sky-300 border border-sky-400/50'
                        : isRose
                        ? 'bg-pink-500/20 text-pink-300 border border-pink-400/40'
                        : isRelief
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                        : 'bg-neutral-700/80 text-neutral-300 border border-neutral-600'
                    }`}
                  >
                    {isFuture
                      ? '全帳消し'
                      : isGalaxy
                      ? '1種目帳消'
                      : isDaisuki
                      ? '救済 腕立て-1'
                      : isSwan
                      ? '連続10回'
                      : isCorgi
                      ? '懸垂10回'
                      : isCrab
                      ? 'スクワット10'
                      : isBirdKiss
                      ? 'パラパラ'
                      : isRose
                      ? '腕立て+1'
                      : isRelief
                      ? '救済'
                      : '妨害'}
                  </span>
                </div>

                {/* Gift Name & Unit */}
                <div className="font-black text-xs sm:text-sm text-white line-clamp-1 leading-snug group-hover:text-amber-300 transition-colors">
                  {gift.name}
                </div>

                <div className="text-[10px] text-neutral-300 font-semibold truncate mt-0.5">
                  {gift.description.split('（')[0]}
                </div>
              </div>

              {/* Action Buttons: Special clear button, Daisuki negative buttons, or standard +1/+10/+50/+100 buttons */}
              {isSpecialClear ? (
                <button
                  onClick={() => handleGiftClick(gift, 1)}
                  className={`w-full py-1.5 rounded-lg font-black text-xs transition active:scale-95 cursor-pointer shadow flex items-center justify-center gap-1 mt-1 ${
                    isFuture
                      ? 'bg-cyan-500 hover:bg-cyan-400 text-neutral-950 border border-cyan-300'
                      : 'bg-indigo-500 hover:bg-indigo-400 text-white border border-indigo-300'
                  }`}
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>発動する (1個)</span>
                </button>
              ) : isDaisuki ? (
                <div className="mt-1 pt-1 border-t border-neutral-800/80 flex items-center gap-1">
                  <button
                    onClick={() => handleGiftClick(gift, 1)}
                    title="大好き1個 (腕立て -1回免除)"
                    className="flex-1 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-mono font-black text-[10px] border border-rose-500/50 active:scale-95 transition cursor-pointer"
                  >
                    -1
                  </button>
                  <button
                    onClick={() => handleGiftClick(gift, 5)}
                    title="大好き5個 (腕立て -5回免除)"
                    className="flex-1 py-1 rounded bg-rose-500/25 hover:bg-rose-500/35 text-rose-300 font-mono font-black text-[10px] border border-rose-500/60 active:scale-95 transition cursor-pointer"
                  >
                    -5
                  </button>
                  <button
                    onClick={() => handleGiftClick(gift, 10)}
                    title="大好き10個 (腕立て -10回免除)"
                    className="flex-1 py-1 rounded bg-rose-500/30 hover:bg-rose-500/40 text-rose-200 font-mono font-black text-[10px] border border-rose-500/70 active:scale-95 transition cursor-pointer"
                  >
                    -10
                  </button>
                  <button
                    onClick={() => handleGiftClick(gift, 50)}
                    title="大好き50個 (腕立て -50回免除)"
                    className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-[10px] active:scale-95 transition cursor-pointer shadow-sm"
                  >
                    -50
                  </button>
                </div>
              ) : (
                <div className="mt-1 pt-1 border-t border-neutral-800/80 flex items-center gap-1">
                  <button
                    onClick={() => handleGiftClick(gift, 1)}
                    title={`1個 (+${gift.repsDelta}回)`}
                    className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-white font-mono font-bold text-[10px] border border-neutral-700 active:scale-95 transition cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => handleGiftClick(gift, 10)}
                    title={`10個 (+${gift.repsDelta * 10}回)`}
                    className="flex-1 py-1 rounded bg-neutral-800 hover:bg-neutral-700 text-amber-300 font-mono font-bold text-[10px] border border-neutral-700 active:scale-95 transition cursor-pointer"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleGiftClick(gift, 50)}
                    title={`50個 (+${gift.repsDelta * 50}回)`}
                    className="flex-1 py-1 rounded bg-amber-600 hover:bg-amber-500 text-neutral-950 font-mono font-black text-[10px] active:scale-95 transition cursor-pointer shadow-sm"
                  >
                    +50
                  </button>
                  <button
                    onClick={() => handleGiftClick(gift, 100)}
                    title={`100個 (+${gift.repsDelta * 100}回)`}
                    className="flex-1 py-1 rounded bg-rose-600 hover:bg-rose-500 text-white font-mono font-black text-[10px] border border-rose-400 active:scale-95 transition cursor-pointer shadow-sm"
                  >
                    +100
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer link */}
      <div className="pt-1.5 mt-1 border-t border-neutral-800 flex items-center justify-between text-[10px] text-neutral-400">
        <span className="truncate">タップで即時ノルマ反映</span>
        <button
          onClick={onOpenCustomGiftModal}
          className="text-neutral-400 hover:text-white flex items-center gap-0.5 underline shrink-0 cursor-pointer"
        >
          <Plus className="w-2.5 h-2.5" />
          追加
        </button>
      </div>
    </div>
  );
};
