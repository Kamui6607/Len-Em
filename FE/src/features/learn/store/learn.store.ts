import { create } from "zustand";
import { learnCourses, learnLessons } from "../data/learn.mock";
import type { Course, Lesson } from "../types/learn.types";

interface VideoProgress {
  watchedSeconds: number;
  completed: boolean;
}

interface LearnState {
  // ── Navigation + course completion (persisted via localStorage) ────────
  currentCourseId: string | null;
  currentLessonId: string | null;
  /** courseId → list of completed lesson ids */
  courseProgress: Record<string, string[]>;

  // ── Current objects + video watch progress (from learn.mock) ───────────
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  /** lessonId → watch state */
  videoProgress: Record<string, VideoProgress>;

  setCurrentLesson: (courseId: string, lessonId: string) => void;
  clearCurrentLesson: () => void;
  markLessonComplete: (courseId: string, lessonId: string) => void;

  setCurrentCourse: (courseId: string) => void;
  setCurrentLessonById: (lessonId: string) => void;
  updateProgress: (lessonId: string, watchedSeconds: number) => void;
}

const STORAGE_KEY = "lenem_learn_store";

function loadPersistedState(): Pick<
  LearnState,
  "currentCourseId" | "currentLessonId" | "courseProgress"
> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { currentCourseId: null, currentLessonId: null, courseProgress: {} };
    }

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    // The old store persisted course completion under the key `progress` — keep
    // reading it so previously saved data isn't lost after the merge.
    const legacy = (parsed.progress ?? {}) as Record<string, string[]>;
    return {
      currentCourseId:
        typeof parsed.currentCourseId === "string" ? parsed.currentCourseId : null,
      currentLessonId:
        typeof parsed.currentLessonId === "string" ? parsed.currentLessonId : null,
      courseProgress: legacy,
    };
  } catch {
    return { currentCourseId: null, currentLessonId: null, courseProgress: {} };
  }
}

function persistState(
  state: Pick<LearnState, "currentCourseId" | "currentLessonId" | "courseProgress">,
) {
  // Keep writing `progress` as the stored key for backward compatibility.
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      currentCourseId: state.currentCourseId,
      currentLessonId: state.currentLessonId,
      progress: state.courseProgress,
    }),
  );
}

const initialState = loadPersistedState();

export const useLearnStore = create<LearnState>((set, get) => ({
  ...initialState,
  currentCourse: null,
  currentLesson: null,
  videoProgress: {},

  setCurrentLesson: (courseId, lessonId) => {
    const next = {
      currentCourseId: courseId,
      currentLessonId: lessonId,
      courseProgress: get().courseProgress,
    };
    persistState(next);
    set(next);

    // Also sync the current objects used by the video player UI.
    const lesson = learnLessons.find((item) => item.id === lessonId) ?? null;
    const course = lesson
      ? learnCourses.find((item) => item.id === lesson.courseId) ?? null
      : null;
    set({ currentLesson: lesson, currentCourse: course });
  },

  clearCurrentLesson: () => {
    const next = {
      currentCourseId: null,
      currentLessonId: null,
      courseProgress: get().courseProgress,
    };
    persistState(next);
    set(next);
  },

  markLessonComplete: (courseId, lessonId) => {
    // Course-level progress (persisted).
    const courseProgress = get().courseProgress;
    const completedLessons = courseProgress[courseId] ?? [];
    const nextCourseProgress = {
      ...courseProgress,
      [courseId]: completedLessons.includes(lessonId)
        ? completedLessons
        : [...completedLessons, lessonId],
    };
    persistState({
      currentCourseId: get().currentCourseId,
      currentLessonId: get().currentLessonId,
      courseProgress: nextCourseProgress,
    });
    set({ courseProgress: nextCourseProgress });

    // Video-level progress.
    set((state) => ({
      videoProgress: {
        ...state.videoProgress,
        [lessonId]: {
          watchedSeconds: state.videoProgress[lessonId]?.watchedSeconds ?? 0,
          completed: true,
        },
      },
    }));
  },

  setCurrentCourse: (courseId) => {
    const course = learnCourses.find((item) => item.id === courseId) ?? null;
    set({ currentCourse: course });
  },

  setCurrentLessonById: (lessonId) => {
    const lesson = learnLessons.find((item) => item.id === lessonId) ?? null;
    const course = lesson
      ? learnCourses.find((item) => item.id === lesson.courseId) ?? null
      : null;
    set({ currentLesson: lesson, currentCourse: course });
  },

  updateProgress: (lessonId, watchedSeconds) => {
    set((state) => {
      const current = state.videoProgress[lessonId];
      return {
        videoProgress: {
          ...state.videoProgress,
          [lessonId]: {
            watchedSeconds: Math.max(current?.watchedSeconds ?? 0, watchedSeconds),
            completed: current?.completed ?? false,
          },
        },
      };
    });
  },
}));
