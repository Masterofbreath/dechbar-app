import { create } from 'zustand'
import type { AkademieNavState, AkademieRoute } from '../types'

const DEFAULT_CATEGORY = 'rezim'

export const useAkademieNav = create<AkademieNavState>((set, get) => ({
  activeCategorySlug: DEFAULT_CATEGORY,
  routeStack: [],

  selectCategory: (slug: string) => {
    set({ activeCategorySlug: slug, routeStack: [] })
  },

  openProgram: (programId: string) => {
    const route: AkademieRoute = { type: 'program', programId }
    set({ routeStack: [route] })
  },

  openSeries: (seriesId: string, programId: string) => {
    const route: AkademieRoute = { type: 'series', seriesId, programId }
    set((state) => ({ routeStack: [...state.routeStack, route] }))
  },

  back: () => {
    const { routeStack } = get()
    if (routeStack.length === 0) return
    set({ routeStack: routeStack.slice(0, -1) })
  },

  reset: () => {
    set({ activeCategorySlug: DEFAULT_CATEGORY, routeStack: [] })
  },
}))
