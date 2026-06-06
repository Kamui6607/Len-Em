import { create } from "zustand";

interface LearnStore {
  currentCourseId: string | null;
  currentLessonId: string | null;
  progress: Record<string, string[]>; // courseId → completed lesson ids
  setCurrentLesson: (courseId: string, lessonId: string) => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;
  clearCurrentLesson: () => void;
}

const STORAGE_KEY = "lenem_learn_store";

function loadPersistedState(): Pick<LearnStore, "currentCourseId" | "currentLessonId" | "progress"> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { currentCourseId: null, currentLessonId: null, progress: {} };
    }

    const parsed = JSON.parse(raw) as Partial<LearnStore>;
    return {
      currentCourseId: parsed.currentCourseId ?? null,
      currentLessonId: parsed.currentLessonId ?? null,
      progress: parsed.progress ?? {},
    };
  } catch {
    return { currentCourseId: null, currentLessonId: null, progress: {} };
  }
}

function persistState(state: Pick<LearnStore, "currentCourseId" | "currentLessonId" | "progress">) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const initialState = loadPersistedState();

export const useLearnStore = create<LearnStore>((set, get) => ({
  ...initialState,
  setCurrentLesson: (courseId, lessonId) => {
    const next = {
      currentCourseId: courseId,
      currentLessonId: lessonId,
      progress: get().progress,
    };
    persistState(next);
    set(next);
  },
  markLessonComplete: (courseId, lessonId) => {
    const progress = get().progress;
    const completedLessons = progress[courseId] ?? [];
    const nextProgress = {
      ...progress,
      [courseId]: completedLessons.includes(lessonId)
        ? completedLessons
        : [...completedLessons, lessonId],
    };
    const next = {
      currentCourseId: get().currentCourseId,
      currentLessonId: get().currentLessonId,
      progress: nextProgress,
    };
    persistState(next);
    set({ progress: nextProgress });
  },
  clearCurrentLesson: () => {
    const next = {
      currentCourseId: null,
      currentLessonId: null,
      progress: get().progress,
    };
    persistState(next);
    set(next);
  },
}));
