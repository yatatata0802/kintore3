export type ExerciseId =
  | 'pushup'
  | 'dumbbell_punch'
  | 'jump_lunge'
  | 'hanging_wiper'
  | 'pull_up'
  | 'all_consecutive'
  | 'knee_up'
  | 'leg_raise'
  | string;

export interface Exercise {
  id: ExerciseId;
  name: string;
  icon: string; // emoji or icon key
  unit: string; // 回
  target: number;
  completed: number;
  isMainGoal?: boolean; // For 腕立て伏せ 500回
  color: string;
  giftEmoji?: string;
  giftName?: string;
}

export type GiftType = 'interference' | 'relief' | 'pushup_penalty' | 'clear_one_sub' | 'clear_all_sub';

export interface GiftRule {
  id: string;
  name: string;
  emoji: string;
  type: GiftType;
  description: string;
  targetExerciseId: ExerciseId;
  // How many reps added or subtracted per trigger
  repsDelta: number; // e.g., +20 for knee-up, -50 for pushup, +50 for pushup penalty
  defaultQuantityText?: string; // e.g. "20本", "1個"
  colorTheme: string;
}

export interface ActionLog {
  id: string;
  timestamp: number;
  type: 'gift' | 'exercise_done' | 'manual_adjust' | 'reset';
  title: string;
  details: string;
  exerciseId?: ExerciseId;
  deltaCompleted?: number;
  deltaTarget?: number;
  giftId?: string;
  giftQuantity?: number;
  clearedExercises?: { id: ExerciseId; previousTarget: number }[];
}
