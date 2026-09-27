import { Exercise } from '../types/workout';

/**
 * Generates formatted text for remaining repetitions
 * As requested: "残り、腕立て◯回"
 */
export function formatRemainingText(exercises: Exercise[]): string {
  const activeRemaining = exercises.filter((e) => Math.max(0, e.target - e.completed) > 0);
  const totalRemaining = exercises.reduce((acc, e) => acc + Math.max(0, e.target - e.completed), 0);

  if (activeRemaining.length === 0) {
    return `🔥 全種目ノルマ達成中！残り 0回！`;
  }

  const items = activeRemaining.map((e) => `${e.name} ${Math.max(0, e.target - e.completed)}回`);
  return `【残りノルマ (計${totalRemaining}回)】\n${items.join(' / ')}`;
}

/**
 * Generates formatted text for completed repetitions
 */
export function formatCompletedText(exercises: Exercise[]): string {
  const totalCompleted = exercises.reduce((acc, e) => acc + e.completed, 0);
  const activeCompleted = exercises.filter((e) => e.completed > 0);

  if (activeCompleted.length === 0) {
    return `やった実績: 0回`;
  }

  const items = activeCompleted.map((e) => `${e.name} ${e.completed}回`);
  return `【やった実績 (計${totalCompleted}回)】\n${items.join(' / ')}`;
}

/**
 * Generates stream end result summary (exercises completed & gifts received)
 */
export function formatSummaryReport(
  exercises: Exercise[],
  gifts: { id: string; name: string; emoji: string; defaultQuantityText?: string }[],
  giftCounts: Record<string, number>
): string {
  const totalRepsDone = exercises.reduce((acc, e) => acc + e.completed, 0);

  const lines: string[] = [];
  lines.push(`【筋トレ配信 終了結果】`);

  exercises.forEach((ex) => {
    lines.push(`・${ex.name}: ${ex.completed}回${ex.target > 0 ? ` (目標${ex.target}回${ex.completed >= ex.target ? ' 達成🎉' : ''})` : ''}`);
  });

  lines.push(`🔥 やった合計: ${totalRepsDone}回`);

  // Gift summary
  const giftEntries: { name: string; emoji: string; count: number; unit: string }[] = [];
  let totalGiftCount = 0;

  gifts.forEach((g) => {
    const count = giftCounts[g.id] || 0;
    if (count > 0) {
      totalGiftCount += count;
      const unit = g.defaultQuantityText?.replace(/[0-9]/g, '') || '個';
      giftEntries.push({
        name: g.name,
        emoji: g.emoji,
        count,
        unit,
      });
    }
  });

  if (giftEntries.length > 0) {
    lines.push(``);
    lines.push(`【いただいたギフトまとめ】`);
    giftEntries.forEach((g) => {
      lines.push(`・${g.emoji} ${g.name}: ${g.count}${g.unit}`);
    });
    lines.push(`🎁 ギフト総数: ${totalGiftCount}個`);
  }

  lines.push(``);
  lines.push(`たくさんの応援・ギフトありがとうございました！`);

  return lines.join('\n');
}

/**
 * Copies string to clipboard with fallback for iframes/security restrictions
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '-9999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return success;
  } catch {
    return false;
  }
}
