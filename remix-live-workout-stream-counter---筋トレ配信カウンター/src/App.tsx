import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { INITIAL_EXERCISES, INITIAL_GIFTS } from './data/initialData';
import { Exercise, GiftRule, ActionLog } from './types/workout';
import { Header } from './components/Header';
import { ExerciseGrid } from './components/ExerciseGrid';
import { GiftPanel } from './components/GiftPanel';
import { SettingsModal } from './components/SettingsModal';
import { StreamOverlayModal } from './components/StreamOverlayModal';
import { SwanSelectModal } from './components/SwanSelectModal';
import { CorgiSelectModal } from './components/CorgiSelectModal';
import { StreamSummaryModal } from './components/StreamSummaryModal';
import { ToastContainer, ToastMessage } from './components/Toast';
import { soundManager } from './utils/sound';
import { WakeLockManager } from './utils/wakeLock';
import { copyToClipboard, formatRemainingText, formatCompletedText } from './utils/formatter';
import { fireVictoryConfetti } from './utils/confetti';

const STORAGE_KEY = 'workout_stream_app_state_v12';

export default function App() {
  // Load state from localStorage if available
  const [exercises, setExercises] = useState<Exercise[]>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_exercises`);
      if (saved) {
        const parsed: Exercise[] = JSON.parse(saved);
        // Exclude pull-up (懸垂辞める) and sort strictly by INITIAL_EXERCISES canonical order
        const orderMap = new Map(INITIAL_EXERCISES.map((e, idx) => [e.id, idx]));
        return parsed
          .filter((e) => e.id !== 'pull_up')
          .sort((a, b) => (orderMap.get(a.id) ?? 999) - (orderMap.get(b.id) ?? 999));
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
        const parsed: GiftRule[] = JSON.parse(saved);
        // Ensure Corgi is configured as relief gift with -10 reps and sort by INITIAL_GIFTS canonical order
        const giftOrderMap = new Map(INITIAL_GIFTS.map((g, idx) => [g.id, idx]));
        return parsed
          .map((g) => {
            if (g.id === 'corgi') {
              return {
                ...g,
                type: 'relief' as const,
                name: 'コーギー',
                emoji: '🐶🐾',
                description: 'いづれかの種目をマイナス10回！',
                targetExerciseId: 'pushup',
                repsDelta: -10,
                defaultQuantityText: '1個',
                colorTheme: 'from-amber-500 via-yellow-500 to-amber-600 border-amber-400',
              };
            }
            return g;
          })
          .sort((a, b) => (giftOrderMap.get(a.id) ?? 999) - (giftOrderMap.get(b.id) ?? 999));
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

  const [rosieModifier, setRosieModifier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_rosie`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return 0;
  });

  const [moneyGunModifier, setMoneyGunModifier] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${STORAGE_KEY}_moneygun`);
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
  const [isSwanModalOpen, setIsSwanModalOpen] = useState<boolean>(false);
  const [isCorgiModalOpen, setIsCorgiModalOpen] = useState<boolean>(false);
  const [corgiTargetReduction, setCorgiTargetReduction] = useState<number>(10);
  const [corgiMultiplier, setCorgiMultiplier] = useState<number>(1);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  // Victory celebration state to trigger only once when clearing
  const [hasCelebratedWin, setHasCelebratedWin] = useState<boolean>(false);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_exercises`, JSON.stringify(exercises));
      localStorage.setItem(`${STORAGE_KEY}_gifts`, JSON.stringify(gifts));
      localStorage.setItem(`${STORAGE_KEY}_base_target`, JSON.stringify(basePushupTarget));
      localStorage.setItem(`${STORAGE_KEY}_rosie`, JSON.stringify(rosieModifier));
      localStorage.setItem(`${STORAGE_KEY}_moneygun`, JSON.stringify(moneyGunModifier));
      localStorage.setItem(`${STORAGE_KEY}_gift_counts`, JSON.stringify(giftCounts));
    } catch {
      // ignore storage errors
    }
  }, [exercises, gifts, basePushupTarget, rosieModifier, moneyGunModifier, giftCounts]);

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
      showToast('🎉 全種目ノルマ完走！俺の勝ち！', 'すべてのノルマを消化しました！大勝利です！', 'success');
    } else if (totalRemaining > 0 && hasCelebratedWin) {
      setHasCelebratedWin(false);
    }
  }, [totalRemaining, exercises, hasCelebratedWin, showToast]);

  // Add pushup completed count (+1, +5, +10, -1, etc.)
  const handleAddPushup = useCallback((count: number) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.isMainGoal || ex.id === 'pushup') {
          const newCompleted = Math.max(0, ex.completed + count);
          return { ...ex, completed: newCompleted };
        }
        return ex;
      })
    );

    const logItem: ActionLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: 'exercise_done',
      title: '腕立て伏せ',
      details: count > 0 ? `+${count}回 消化` : `${count}回 修正`,
      exerciseId: 'pushup',
      deltaCompleted: count,
    };
    setLogs((prev) => [logItem, ...prev.slice(0, 49)]);
  }, []);

  // Add sub-exercise reps completed (+1, +5, -1, etc.)
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

  // Complete all remaining reps for a sub-exercise
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

    setGiftCounts((prev) => ({ ...prev, galaxy: (prev['galaxy'] || prev['swan'] || 0) + 1 }));
    setIsSwanModalOpen(false);
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

  // Execute reduction of an exercise by Corgi (コーギー 救済ギフト: 1個でマイナス10回)
  const handleApplyCorgiReduction = useCallback((targetEx: Exercise, quantity: number) => {
    const totalReduction = quantity * 10;
    const remaining = Math.max(0, targetEx.target - targetEx.completed);
    if (remaining <= 0) return;

    const actualReduction = Math.min(remaining, totalReduction);

    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id === targetEx.id) {
          return { ...ex, target: ex.target - actualReduction };
        }
        return ex;
      })
    );

    setGiftCounts((prev) => ({
      ...prev,
      corgi: (prev['corgi'] || 0) + quantity,
    }));

    setIsCorgiModalOpen(false);
    soundManager.playRelief();

    const newRemaining = Math.max(0, targetEx.target - actualReduction - targetEx.completed);

    const logItem: ActionLog = {
      id: `${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: 'gift',
      title: `🐶 コーギー救済 (×${quantity})`,
      details: `${targetEx.name} -${actualReduction}回 免除 (残${newRemaining}回)`,
      exerciseId: targetEx.id,
      giftId: 'corgi',
      giftQuantity: quantity,
      deltaTarget: -actualReduction,
    };
    setLogs((prev) => [logItem, ...prev.slice(0, 49)]);

    showToast(
      `🐶🐾 コーギー救済！ (×${quantity})`,
      `${targetEx.name} を -${actualReduction}回 減らしました！（残り${newRemaining}回）`,
      'success'
    );
  }, [showToast]);

  // Trigger Gift (Interference, Finger Heart penalty, Money Gun all-consecutive, Corgi relief, Galaxy, Encounter with Future)
  const handleTriggerGift = useCallback((gift: GiftRule, multiplier: number) => {
    const totalDelta = gift.repsDelta * multiplier;

    // 🐶🐾 コーギー：いずれかの種目をマイナス10回（救済ギフト）
    if (gift.id === 'corgi') {
      const remainingExercises = exercises.filter((ex) => ex.target > ex.completed);
      if (remainingExercises.length === 0) {
        showToast('🐶🐾 コーギー', '現在、減らす残りノルマはありません', 'info');
        return;
      }

      const corgiCount = multiplier;
      const reductionReps = corgiCount * 10;

      if (remainingExercises.length === 1) {
        // 1種目のみ残っている場合は即座にその種目を減算！
        handleApplyCorgiReduction(remainingExercises[0], corgiCount);
      } else {
        // 複数種目ある場合は選択モーダルを開く
        setCorgiTargetReduction(reductionReps);
        setCorgiMultiplier(corgiCount);
        setIsCorgiModalOpen(true);
      }
      return;
    }

    // 🌌 銀河：いずれか1種目を帳消し
    if (gift.id === 'galaxy' || gift.id === 'swan' || gift.type === 'clear_one_sub') {
      const remainingExercises = exercises.filter((ex) => ex.target > ex.completed);
      if (remainingExercises.length === 0) {
        showToast('🌌 銀河', '現在、帳消しにできる残りノルマはありません', 'info');
        return;
      }
      if (remainingExercises.length === 1) {
        // 1種目のみなら即座に帳消し！
        handleClearOneExercise(remainingExercises[0]);
      } else {
        // 複数ある場合は選択モーダルを開く
        setIsSwanModalOpen(true);
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

      setGiftCounts((prev) => ({ ...prev, encounter_with_future: (prev['encounter_with_future'] || prev['firework'] || 0) + 1 }));
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

    if (gift.id === 'finger_heart' || gift.id === 'rose_bean_rosie') {
      // フィンガーハート1個で、腕立て１回 (妨害)
      setRosieModifier((prev) => prev + totalDelta);
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.isMainGoal || ex.id === 'pushup') {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      showToast(
        `🫰 妨害！フィンガーハート ×${multiplier}`,
        `腕立て伏せが +${totalDelta}回 追加された！`,
        'warning'
      );
    } else if (gift.id === 'money_gun' && gift.targetExerciseId === 'all_consecutive') {
      // マネーガンで、全種目連続５回
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === 'all_consecutive') {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      showToast(
        `🔫💵 マネーガン発動！ ×${multiplier}`,
        `🔥 全種目連続 +${totalDelta}回 の激ヤバノルマ追加！`,
        'warning'
      );
    } else {
      // Standard interference exercises (Dumbbell punch, Jump lunge, Hanging wiper, Pull-up, etc.)
      setExercises((prev) =>
        prev.map((ex) => {
          if (ex.id === gift.targetExerciseId) {
            return { ...ex, target: ex.target + totalDelta };
          }
          return ex;
        })
      );
      const ex = exercises.find((e) => e.id === gift.targetExerciseId);
      const exName = ex ? ex.name : '妨害種目';
      showToast(
        `⚡ ギフト妨害！${gift.name} ×${multiplier}`,
        `${exName} +${totalDelta}回 ノルマ追加！`,
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
  }, [exercises, handleApplyCorgiReduction, handleClearOneExercise, showToast]);

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

    // If it was a clear action (Swan or Firework)
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
    } else if (lastLog.type === 'gift' && lastLog.deltaTarget && lastLog.exerciseId) {
      const delta = lastLog.deltaTarget;
      if (lastLog.title.includes('ロージー')) {
        setRosieModifier((prev) => Math.max(0, prev - delta));
        setExercises((prev) =>
          prev.map((ex) => (ex.isMainGoal || ex.id === 'pushup' ? { ...ex, target: ex.target - delta } : ex))
        );
      } else if (lastLog.title.includes('マネーガン')) {
        const absDelta = Math.abs(delta);
        setMoneyGunModifier((prev) => Math.max(0, prev - absDelta));
        setExercises((prev) =>
          prev.map((ex) => (ex.isMainGoal || ex.id === 'pushup' ? { ...ex, target: ex.target + absDelta } : ex))
        );
      } else {
        setExercises((prev) =>
          prev.map((ex) => (ex.id === lastLog.exerciseId ? { ...ex, target: Math.max(0, ex.target - delta) } : ex))
        );
      }
      showToast('↩️ ギフトを取り消しました', `${lastLog.title}のノルマ変更を元に戻しました`, 'info');
    }
  }, [logs, showToast]);

  // Reset entire stream workout state
  const handleResetStream = useCallback(() => {
    setExercises(INITIAL_EXERCISES);
    setRosieModifier(0);
    setMoneyGunModifier(0);
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
    setRosieModifier(0);
    setMoneyGunModifier(0);
    setHasCelebratedWin(false);
    setLogs([]);
    showToast('🔄 カウントをリセットしました', `腕立て${basePushupTarget}回でスタート！`);
  };

  const handleResetAllToDefault = () => {
    setExercises(INITIAL_EXERCISES);
    setGifts(INITIAL_GIFTS);
    setBasePushupTarget(500);
    setRosieModifier(0);
    setMoneyGunModifier(0);
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
        isOpen={isSwanModalOpen}
        onClose={() => setIsSwanModalOpen(false)}
        activeSubExercises={activeExercisesWithRemaining}
        onSelectExerciseToClear={handleClearOneExercise}
      />

      {/* Corgi Rescue Rep Reduction Modal */}
      <CorgiSelectModal
        isOpen={isCorgiModalOpen}
        onClose={() => setIsCorgiModalOpen(false)}
        activeExercises={activeExercisesWithRemaining}
        reductionReps={corgiTargetReduction}
        corgiCount={corgiMultiplier}
        onSelectExercise={(ex) => handleApplyCorgiReduction(ex, corgiMultiplier)}
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
