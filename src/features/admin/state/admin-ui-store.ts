'use client';
// admin-boundary: foundation

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Transient console state that is not server data and does not belong in the URL:
 * bulk selection, the command palette, and the viewer's density preference.
 * Server data never lands here — that is TanStack Query's job.
 */
interface AdminUiState {
  /** Ids selected in the current list. Cleared whenever the list's filters change. */
  selection: string[];
  selectionScope: string | null;
  paletteOpen: boolean;
  density: 'comfortable' | 'compact';

  toggleSelected: (scope: string, id: string) => void;
  setSelection: (scope: string, ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (scope: string, id: string) => boolean;
  setPaletteOpen: (open: boolean) => void;
  setDensity: (density: 'comfortable' | 'compact') => void;
}

export const useAdminUiStore = create<AdminUiState>()(
  persist(
    (set, get) => ({
      selection: [],
      selectionScope: null,
      paletteOpen: false,
      density: 'comfortable',

      toggleSelected: (scope, id) =>
        set(state => {
          const sameScope = state.selectionScope === scope;
          const current = sameScope ? state.selection : [];
          const selection = current.includes(id)
            ? current.filter(entry => entry !== id)
            : [...current, id];
          return { selection, selectionScope: scope };
        }),

      setSelection: (scope, ids) => set({ selection: ids, selectionScope: scope }),
      clearSelection: () => set({ selection: [], selectionScope: null }),
      isSelected: (scope, id) => {
        const state = get();
        return state.selectionScope === scope && state.selection.includes(id);
      },

      setPaletteOpen: paletteOpen => set({ paletteOpen }),
      setDensity: density => set({ density }),
    }),
    {
      name: 'elimika-admin-ui',
      // Only the preference survives a reload; a stale selection would act on rows
      // the admin can no longer see.
      partialize: state => ({ density: state.density }),
    }
  )
);
