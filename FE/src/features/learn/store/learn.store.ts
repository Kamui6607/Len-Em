import { create } from "zustand";
import { learnCourses, learnLessons } from "../data/learn.mock";
import type { Course, Lesson } from "../types/learn.types";

interface LearnProgress {
  watchedSeconds: number;
  completed: boolean;
}

interface LearnState {
  currentCourse: Course | null;
  currentLesson: Lesson | null;
  progress: Record<string, LearnProgress>;
  setCurrentCourse: (courseId: string) => void;
  setCurrentLesson: (lessonId: string) => void;
  updateProgress: (lessonId: string, watchedSeconds: number) => void;
  markLessonComplete: (lessonId: string) => void;
}

export const useLearnStore = create<LearnState>((set) => ({
  currentCourse: null,
  currentLesson: null,
  progress: {},
  setCurrentCourse: (courseId) => {
    const course = learnCourses.find((item) => item.id === courseId) ?? null;
    set({ currentCourse: course });
  },
  setCurrentLesson: (lessonId) => {
    const lesson = learnLessons.find((item) => item.id === lessonId) ?? null;
    const course = lesson
      ? learnCourses.find((item) => item.id === lesson.courseId) ?? null
      : null;

    set({ currentLesson: lesson, currentCourse: course });
  },
  updateProgress: (lessonId, watchedSeconds) => {
    set((state) => {
      const current = state.progress[lessonId];
      return {
        progress: {
          ...state.progress,
          [lessonId]: {
            watchedSeconds: Math.max(current?.watchedSeconds ?? 0, watchedSeconds),
            completed: current?.completed ?? false,
          },
        },
      };
    });
  },
  markLessonComplete: (lessonId) => {
    set((state) => ({
      progress: {
        ...state.progress,
        [lessonId]: {
          watchedSeconds: state.progress[lessonId]?.watchedSeconds ?? 0,
          completed: true,
        },
      },
    }));
  },
}));
