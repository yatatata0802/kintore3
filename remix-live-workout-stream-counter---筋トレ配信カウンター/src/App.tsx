import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_EXERCISES, INITIAL_GIFTS } from './data/initialData';
import { Exercise, GiftRule, ActionLog } from './types/workout';
import { Header } from './components/Header';
import { ExerciseGrid } from './components/ExerciseGrid';
import { GiftPanel } from './components/GiftPanel';
import { SettingsModal } from './components/SettingsModal';
import { StreamOverlayModal } from './components/StreamOverlayModal';
import { SwanSelectModal } from './components/SwanSelectModal';
import { StreamSummaryModal } from './components/StreamSummaryModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { soundManager } from './utils/sound';
import { WakeLockManager } from './utils/wakeLock';
import { copyToClipboard, formatRemainingText, formatCompletedText } from './utils/formatter';
import { fireVictoryConfetti } from './utils/confetti';

const STORAGE_KEY = 'workout_stream_app_state_v14';

export default function App() {
  // Load state from localStorage if available
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_exercises`);
      if (saved) {
        const parsed: Exercise[] = JSON.parse(saved).map((e: Exercise) => {
          const init = INITIAL_EXERCISES.find((i) => i.id === e.id);
          return init ? { ...e, giftEmoji: init.giftEmoji, giftName: init.giftName } : e;
        });
        const orderMap = new Map(INITIAL_EXERCISES.map((e, idx) => [e.id, idx]));
        return parsed.sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
      }
    } catch {
      // ignore
    }
    return INITIAL_EXERCISES;
  });

  const [gifts, setGifts] = useState<GiftRule[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_gifts`);
      if (saved) {
        const parsed: GiftRule[] = JSON.parse(saved).map((g: GiftRule) => {
          const init = INITIAL_GIFTS.find((i) => i.id === g.id);
          return init ? { ...g, name: init.name, emoji: init.emoji } : g;
        });
        const giftOrderMap = new Map(INITIAL_GIFTS.map((g, idx) => [g.id, idx]));
        return parsed.sort((a, b) => (giftOrderMap.get(a.id) ?? 999) - (giftOrderMap.get(b.id) ?? 999));
      }
    } catch {
      // ignore
    }
    return INITIAL_GIFTS;
  });

  const [basePushupTarget, setBasePushupTarget] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_base_target`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return 0;
  });

  const [logs, setLogs] = useState<ActionLog[]>([]);
  const [giftCounts, setGiftCounts] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_gift_counts`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {};
  });
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  const [isWakeLockActive, setIsWakeLockActive] = useState<boolean>(false);
  const [copiedType, setCopiedType] = useState<'remaining' | 'completed' | null>(null);

  // Modals
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState<boolean>(false);
  const [isGalaxyModalOpen, setIsGalaxyModalOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  // Victory celebration state to trigger only once when clearing
  const [hasCelebratedWin, setHasCelebratedWin] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_exercises`, JSON.stringify(exercises));
      localStorage.setItem(`${STORAGE_KEY}_gifts`, JSON.stringify(gifts));
      localStorage.setItem(`${STORAGE_KEY}_base_target`, JSON.stringify(basePushupTarget));
      localStorage.setItem(`${STORAGE_KEY}_gift_counts`, JSON.stringify(giftCounts));
    } catch {
      // ignore storage errors
    }
  }, [exercises, gifts, basePushupTarget, giftCounts]);

  // Toast helper
  const showToast = useCallback((title: string, subtitle?: string, type: 'success' | 'info' | 'warning' = 'success') => {
    const id = `${Date.now()}_${Math.random()}`;
    setToasts((prev) => [...prev.slice(-3), { id, title, subtitle, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2800);
  }, []);

  // Summary numbers
  const pushup = useMemo(() => exercises.find((e) => e.isMainGoal || e.id === 'pushup') || exercises[0], [exercises]);
  const pushupRemaining = Math.max(0, pushup.target - pushup.completed);

  const totalCompleted = useMemo(() => {
    return exercises.reduce((acc, curr) => acc + curr.completed, 0);
  }, [exercises]);

  const totalRemaining = useMemo(() => {
    return exercises.reduce((acc, curr) => acc + Math.max(0, curr.target - curr.completed), 0);
  }, [exercises]);

  // Check victory condition (when total remaining reaches 0 and there was active target)
  useEffect(() => {
    const hasAnyTarget = exercises.some((e) => e.target > 0);
    if (hasAnyTarget && totalRemaining === 0 && !hasCelebratedWin) {
      setHasCelebratedWin(true);
      fireVictoryConfetti();
      soundManager.playVictory();
      showToast('🎉 全種目ノルマ完走！大勝利！', 'すべてのノルマを消化しました！', 'success');
    } else if (totalRemaining > 0 && hasCelebratedWin) {
      setHasCelebratedWin(false);
    }
  }, [totalRemaining, exercises, hasCelebratedWin, showToast]);

  // Add reps completed for any exercise (+1, +5, +10, -1, etc.)
  const handleAddSubExerciseReps = useCallback((exerciseId: string, delta: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          const newCompleted = Math.max(0, ex.completed + delta);
          return { ...ex, completed: newCompleted };
        }
        return ex;
      })
    );

    const targetEx = exercises.find((e) => e.id === exerciseId);
    const logItem: ActionLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: 'exercise_done',
      title: targetEx ? targetEx.name : '筋トレ種目',
      details: delta > 0 ? `+${delta}回 消化` : `${delta}回 修正`,
      exerciseId,
      deltaCompleted: delta,
    };
    setLogs((prev) => [logItem, ...prev.slice(0, 49)]);
  }, [exercises]);

  // Complete all remaining reps for an exercise
  const handleCompleteAllSubExercise = useCallback((exerciseId: string) => {
    const targetEx = exercises.find((e) => e.id === exerciseId);
    if (!targetEx) return;
    const remaining = Math.max(0, targetEx.target - targetEx.completed);
    if (remaining <= 0) return;

    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === exerciseId) {
          return { ...ex, completed: ex.target };
        }
        return ex;
      })
    );

    const logItem: ActionLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: 'exercise_done',
      title: targetEx.name,
      details: `残り${remaining}回 一括完了！`,
      exerciseId,
      deltaCompleted: remaining,
    };
    setLogs((prev) => [logItem, ...prev.slice(0, 49)]);
    showToast(`✅ ${targetEx.name} 完了！`, `残り${remaining}回を消化しました`);
  }, [exercises, showToast]);

  // Active exercises that currently have remaining reps to clear
  const activeExercisesWithRemaining = useMemo(() => {
    return exercises.filter((ex) => ex.target > ex.completed);
  }, [exercises]);

  // Execute clearing of a single exercise (by Galaxy / 銀河)
  const handleClearOneExercise = useCallback((targetEx: Exercise) => {
    const remaining = Math.max(0, targetEx.target - targetEx.completed);
    if (remaining <= 0) return;

    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === targetEx.id) {
          return { ...ex, target: ex.completed };
        }
        return ex;
      })
    );

    setGiftCounts((prev) => ({ ...prev, galaxy: (prev['galaxy'] || 0) + 1 }));
    setIsGalaxyModalOpen(false);
    soundManager.playRelief();

    const logItem: ActionLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: 'gift',
      title: `🌌 銀河 (1種目帳消し)`,
      details: `${targetEx.name} 残り${remaining}回 免除`,
      exerciseId: targetEx.id,
      giftId: 'galaxy',
      giftQuantity: 1,
      clearedExercises: [{ id: targetEx.id, previousTarget: targetEx.target }],
    };
    setLogs((prev) => [logItem, ...prev.slice(0, 49)]);
    showToast('🌌 銀河発動！1種目帳消し！', `${targetEx.name}の残り${remaining}回を帳消しにしました！`, 'success');
  }, [showToast]);

  // Trigger Gift
  const handleTriggerGift = useCallback((gift: GiftRule, multiplier: number) => {
    const totalDelta = gift.repsDelta * multiplier;

    // 🌌 銀河：いずれか1種目を帳消し
    if (gift.id === 'galaxy' || gift.type === 'clear_one_sub') {
      const remainingExercises = exercises.filter((ex) => ex.target > ex.completed);
      if (remainingExercises.length === 0) {
        showToast('🌌 銀河', '現在、帳消しにできる残りノルマはありません', 'info');
        return;
      }
      if (remainingExercises.length === 1) {
        handleClearOneExercise(remainingExercises[0]);
      } else {
        setIsGalaxyModalOpen(true);
      }
      return;
    }

    // 🛸 未来との遭遇：すべて帳消し
    if (gift.id === 'encounter_with_future' || gift.id === 'firework' || gift.type === 'clear_all_sub') {
      const remainingExercises = exercises.filter((ex) => ex.target > ex.completed);
      if (remainingExercises.length === 0) {
        showToast('🛸 未来との遭遇', '現在、帳消しにできる残りノルマはありません', 'info');
        return;
      }

      let totalCleared = 0;
      const clearedList: { id: string; previousTarget: number }[] = [];

      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.target > ex.completed) {
            totalCleared += (ex.target - ex.completed);
            clearedList.push({ id: ex.id, previousTarget: ex.target });
            return { ...ex, target: ex.completed };
          }
          return ex;
        })
      );

      setGiftCounts((prev) => ({ ...prev, encounter_with_future: (prev['encounter_with_future'] || 0) + 1 }));
      fireVictoryConfetti();
      soundManager.playVictory();

      const logItem: ActionLog = {
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        type: 'gift',
        title: `🛸 未来との遭遇 (全種目帳消し)`,
        details: `全種目残りノルマ (${totalCleared}回分) 一撃免除`,
        giftId: 'encounter_with_future',
        giftQuantity: 1,
        clearedExercises: clearedList,
      };
      setLogs((prev) => [logItem, ...prev.slice(0, 49)]);
      showToast('🛸 神救済・未来との遭遇発動！', `すべてのノルマ（合計${totalCleared}回）を全帳消し！`, 'success');
      return;
    }

    // Record gift count
    setGiftCounts((prev) => ({
      ...prev,
      [gift.id]: (prev[gift.id] || 0) + multiplier,
    }));

    if (gift.id === 'daisuki') {
      // バラ（id: daisuki）：腕立てマイナス 1回 × multiplier
      const pushupEx = exercises.find((e) => e.isMainGoal || e.id === 'pushup');
      const curRemaining = pushupEx ? Math.max(0, pushupEx.target - pushupEx.completed) : 0;
      const actualMinus = Math.min(curRemaining, Math.abs(totalDelta));

      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.isMainGoal || ex.id === 'pushup') {
            return { ...ex, target: Math.max(ex.completed, ex.target - actualMinus) };
          }
          return ex;
        })
      );
      showToast(
        `🌹 救済！バラ ×${multiplier}`,
        `腕立て伏せが -${actualMinus}回 減りました！`,
        'success'
      );

      const logItem: ActionLog = {
        id: `${Date.now()}_${Math.random()}`,
        timestamp: Date.now(),
        type: 'gift',
        title: `${gift.name} (×${multiplier})`,
        details: `腕立て -${actualMinus}回 救済`,
        exerciseId: 'pushup',
        giftId: gift.id,
        giftQuantity: multiplier,
        deltaTarget: -actualMinus,
      };
      setLogs((prev) => [logItem, ...prev.slice(0, 49)]);
      return;
    }

    if (gift.id === 'rose') {
      // 野球（id: rose）：腕立て伏せ +1回
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.isMainGoal || ex.id === 'pushup') {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      showToast(
        `⚾ 野球 ×${multiplier}`,
        `腕立て伏せ +${totalDelta}回 追加！`,
        'warning'
      );
    } else if (gift.id === 'cheering_crab') {
      // 応援するカニ：ジャンプスクワット 10回追加
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === 'jump_squat') {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      showToast(
        `🦀 応援するカニ ×${multiplier}`,
        `ジャンプスクワット +${totalDelta}回 追加！`,
        'warning'
      );
    } else if (gift.id === 'bird_kiss') {
      // 小鳥のキス：パラパラ踊る 1回追加
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === 'parapara_dance') {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      showToast(
        `🐦💋 小鳥のキス ×${multiplier}`,
        `パラパラ踊る +${totalDelta}回 追加！`,
        'warning'
      );
    } else if (gift.id === 'corgi') {
      // コーギー：懸垂 10回追加
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === 'pull_up') {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      showToast(
        `🐶🐾 コーギー ×${multiplier}`,
        `懸垂 +${totalDelta}回 追加！`,
        'warning'
      );
    } else if (gift.id === 'swan') {
      // 白鳥：すべて連続で10回 (パラパラ以外) 1回追加
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === 'all_consecutive_no_para') {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      showToast(
        `🦢 白鳥発動！ ×${multiplier}`,
        `すべて連続で10回 (パラパラ以外) +${totalDelta}回 追加！`,
        'warning'
      );
    } else {
      // Standard target
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === gift.targetExerciseId) {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      const ex = exercises.find((e) => e.id === gift.targetExerciseId);
      const exName = ex ? ex.name : '筋トレ種目';
      showToast(
        `⚡ ギフト！${gift.name} ×${multiplier}`,
        `${exName} +${totalDelta}回 追加！`,
        'warning'
      );
    }

    const logItem: ActionLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: 'gift',
      title: `${gift.name} (×${multiplier})`,
      details: `${totalDelta > 0 ? `+${totalDelta}` : totalDelta}回`,
      exerciseId: gift.targetExerciseId,
      giftId: gift.id,
      giftQuantity: multiplier,
      deltaTarget: totalDelta,
    };
    setLogs((prev) => [logItem, ...prev.slice(0, 49)]);
  }, [exercises, handleClearOneExercise, showToast]);

  // Undo last action
  const handleUndo = useCallback(() => {
    if (logs.length === 0) return;
    const [lastLog, ...restLogs] = logs;
    setLogs(restLogs);

    // If it had a recorded gift count
    if (lastLog.giftId && lastLog.giftQuantity) {
      setGiftCounts((prev) => ({
        ...prev,
        [lastLog.giftId!]: Math.max(0, (prev[lastLog.giftId!] || 0) - lastLog.giftQuantity!),
      }));
    }

    // If it was a clear action (Galaxy or Future)
    if (lastLog.clearedExercises && lastLog.clearedExercises.length > 0) {
      setExercises((prev) =>
        prev.map((ex) => {
          const match = lastLog.clearedExercises?.find((c) => c.id === ex.id);
          if (match) {
            return { ...ex, target: match.previousTarget };
          }
          return ex;
        })
      );
      showToast('↩️ 帳消しを取り消しました', `${lastLog.title}の免除を元に戻しました`, 'info');
      return;
    }

    if (lastLog.type === 'exercise_done' && lastLog.deltaCompleted && lastLog.exerciseId) {
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === lastLog.exerciseId) {
            return { ...ex, completed: Math.max(0, ex.completed - (lastLog.deltaCompleted || 0)) };
          }
          return ex;
        })
      );
      showToast('↩️ 元に戻しました', `${lastLog.title}の消化操作を取り消しました`, 'info');
    } else if (lastLog.type === 'gift' && lastLog.deltaTarget !== undefined && lastLog.exerciseId) {
      const delta = lastLog.deltaTarget;
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === lastLog.exerciseId) {
            return { ...ex, target: Math.max(ex.completed, ex.target - delta) };
          }
          return ex;
        })
      );
      showToast('↩️ ギフトを取り消しました', `${lastLog.title}の変更を元に戻しました`, 'info');
    }
  }, [logs, showToast]);

  // Reset entire stream workout state
  const handleResetStream = useCallback(() => {
    setExercises(INITIAL_EXERCISES);
    setGiftCounts({});
    setLogs([]);
    setHasCelebratedWin(false);
    showToast('🔄 リセット完了', '新しい配信に向けてデータを初期化しました', 'info');
  }, [showToast]);

  // Copy Handlers
  const handleCopyRemaining = useCallback(async () => {
    const text = formatRemainingText(exercises);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedType('remaining');
      showToast('📋 「残り回数」をコピーしました！', `残り、腕立て${pushupRemaining}回 (配信コメント等に貼付可)`);
      setTimeout(() => setCopiedType(null), 2500);
      soundManager.playCountTap(600);
    }
  }, [exercises, pushupRemaining, showToast]);

  const handleCopyCompleted = useCallback(async () => {
    const text = formatCompletedText(exercises);
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedType('completed');
      showToast('📋 「やった実績」をコピーしました！', `実績、腕立て${pushup.completed}回 / 目標${pushup.target}回`);
      setTimeout(() => setCopiedType(null), 2500);
      soundManager.playCountTap(600);
    }
  }, [exercises, pushup.completed, pushup.target, showToast]);

  // Sound toggle
  const handleToggleSound = () => {
    const next = !isSoundEnabled;
    setIsSoundEnabled(next);
    soundManager.setEnabled(next);
  };

  // Wake lock toggle
  const handleToggleWakeLock = async () => {
    if (isWakeLockActive) {
      WakeLockManager.release();
      setIsWakeLockActive(false);
      showToast('画面スリープ防止を解除しました', undefined, 'info');
    } else {
      const success = await WakeLockManager.request();
      setIsWakeLockActive(success);
      if (success) {
        showToast('🔆 画面スリープ防止ON', '配信中に画面が自動消灯しなくなりました');
      } else {
        showToast('スリープ防止がブラウザで非対応です', undefined, 'info');
      }
    }
  };

  // Reset actions
  const handleResetWorkout = () => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.isMainGoal || ex.id === 'pushup') {
          return { ...ex, completed: 0, target: basePushupTarget };
        }
        return { ...ex, completed: 0, target: 0 };
      })
    );
    setHasCelebratedWin(false);
    setLogs([]);
    showToast('🔄 カウントをリセットしました', `腕立て${basePushupTarget}回でスタート！`);
  };

  const handleResetAllToDefault = () => {
    setExercises(INITIAL_EXERCISES);
    setGifts(INITIAL_GIFTS);
    setBasePushupTarget(0);
    setHasCelebratedWin(false);
    setLogs([]);
    showToast('✨ 初期設定に復元しました');
  };

  const handleUpdateBaseTarget = (newTarget: number) => {
    setBasePushupTarget(newTarget);
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.isMainGoal || ex.id === 'pushup') {
          const diff = newTarget - basePushupTarget;
          return { ...ex, target: Math.max(0, ex.target + diff) };
        }
        return ex;
      })
    );
    showToast('⚙️ 基本目標を更新しました', `腕立て目標: ${newTarget}回`);
  };

  const handleAddCustomGift = (newGift: GiftRule) => {
    setGifts((prev) => [...prev, newGift]);
    showToast(`🎁 ギフト「${newGift.name}」を追加しました`);
  };

  return (
    <div className="h-screen h-[100dvh] max-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans select-none antialiased overflow-hidden">
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} />

      {/* Top Header Navigation */}
      <Header
        totalCompleted={totalCompleted}
        totalRemaining={totalRemaining}
        pushupRemaining={pushupRemaining}
        historyLength={logs.length}
        isSoundEnabled={isSoundEnabled}
        isWakeLockActive={isWakeLockActive}
        onToggleSound={handleToggleSound}
        onToggleWakeLock={handleToggleWakeLock}
        onUndo={handleUndo}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenOverlay={() => setIsOverlayOpen(true)}
        onOpenSummary={() => setIsSummaryOpen(true)}
        onQuickCopyRemaining={handleCopyRemaining}
        onQuickCopyCompleted={handleCopyCompleted}
      />

      {/* Main Content Area: Horizontal 2-column balanced layout (All Exercises on the left, Gifts on the right) */}
      <main className="flex-1 p-2 sm:p-2.5 w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-2.5 overflow-hidden">
        {/* Left Side (7/12): All exercises in equal cards with quick count buttons and clear status */}
        <div className="lg:col-span-7 flex flex-col h-full overflow-hidden">
          <ExerciseGrid
            exercises={exercises}
            onAddReps={handleAddSubExerciseReps}
            onCompleteAll={handleCompleteAllSubExercise}
          />
        </div>

        {/* Right Side (5/12): Gift Quick Tap & Rapid Rose Bar */}
        <div className="lg:col-span-5 flex flex-col h-full overflow-hidden">
          <GiftPanel
            gifts={gifts}
            onTriggerGift={handleTriggerGift}
            onOpenCustomGiftModal={() => setIsSettingsOpen(true)}
          />
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        basePushupTarget={basePushupTarget}
        onUpdateBaseTarget={handleUpdateBaseTarget}
        onResetWorkout={handleResetWorkout}
        onResetAllToDefault={handleResetAllToDefault}
        gifts={gifts}
        exercises={exercises}
        onAddCustomGift={handleAddCustomGift}
        logs={logs}
      />

      {/* Stream / OBS Overlay Modal */}
      <StreamOverlayModal
        isOpen={isOverlayOpen}
        onClose={() => setIsOverlayOpen(false)}
        exercises={exercises}
        totalCompleted={totalCompleted}
      />

      {/* Galaxy Clear Selection Modal */}
      <SwanSelectModal
        isOpen={isGalaxyModalOpen}
        onClose={() => setIsGalaxyModalOpen(false)}
        activeSubExercises={activeExercisesWithRemaining}
        onSelectExerciseToClear={handleClearOneExercise}
      />

      {/* Stream End Summary & Copy Modal */}
      <StreamSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        exercises={exercises}
        gifts={gifts}
        giftCounts={giftCounts}
        onResetStream={handleResetStream}
      />
    </div>
  );
}
