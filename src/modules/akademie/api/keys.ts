// React Query cache keys pro Akademie modul

export const akademieKeys = {
  all: ['akademie'] as const,

  categories: () => [...akademieKeys.all, 'categories'] as const,

  programs: () => [...akademieKeys.all, 'programs'] as const,
  programsByCategory: (categorySlug: string) =>
    [...akademieKeys.programs(), 'category', categorySlug] as const,

  programDetail: (moduleId: string) =>
    [...akademieKeys.all, 'program', moduleId] as const,

  series: (moduleId: string) =>
    [...akademieKeys.programDetail(moduleId), 'series'] as const,

  lessons: (seriesId: string) =>
    [...akademieKeys.all, 'lessons', seriesId] as const,

  userAccess: (userId: string) =>
    [...akademieKeys.all, 'access', userId] as const,

  progress: (userId: string) =>
    [...akademieKeys.all, 'progress', userId] as const,

  lessonProgress: (userId: string, lessonId: string) =>
    [...akademieKeys.progress(userId), 'lesson', lessonId] as const,

  // Daily Program System
  activeProgram: (userId: string) =>
    [...akademieKeys.all, 'activeProgram', userId] as const,

  featuredProgram: () =>
    [...akademieKeys.all, 'featuredProgram'] as const,

  dailyOverride: () =>
    [...akademieKeys.all, 'dailyOverride'] as const,

  // Admin: all overrides (array) — separate key to avoid cache collision with dailyOverride (single)
  dailyOverrideAdmin: () =>
    [...akademieKeys.all, 'dailyOverride', 'admin'] as const,

  nextLesson: (userId: string) =>
    [...akademieKeys.all, 'nextLesson', userId] as const,

  // Completion-based unlock state pro daný program (Akademie detail view)
  programUnlockState: (userId: string, moduleId: string) =>
    [...akademieKeys.all, 'programUnlockState', userId, moduleId] as const,
}
