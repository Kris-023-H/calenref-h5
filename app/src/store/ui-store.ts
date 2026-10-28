/**
 * store/ui-store.ts — 瞬时 UI 状态：底部抽屉、Toast、横滑容器引用。
 * 不持久化；抽屉/提示均由各屏调用 openSheet/showToast 驱动。
 */

import { create } from 'zustand';

export type SheetKind = 'guide' | 'share' | 'why' | 'books' | 'elder' | 'pay' | null;

export interface UiState {
  sheet: SheetKind;
  sheetPayload: Record<string, string> | null;
  toast: string | null;
  openSheet: (kind: Exclude<SheetKind, null>, payload?: Record<string, string>) => void;
  closeSheet: () => void;
  showToast: (msg: string) => void;
  hideToast: () => void;
}

export const useUi = create<UiState>((set) => ({
  sheet: null,
  sheetPayload: null,
  toast: null,
  openSheet: (kind, payload) => set({ sheet: kind, sheetPayload: payload ?? null }),
  closeSheet: () => set({ sheet: null, sheetPayload: null }),
  showToast: (msg) => set({ toast: msg }),
  hideToast: () => set({ toast: null }),
}));
