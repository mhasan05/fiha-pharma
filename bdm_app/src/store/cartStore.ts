import { create } from "zustand";

import { StorageKeys } from "@/lib/constants";
import { secureStorage } from "@/lib/storage";
import type { CartLine, Product } from "@/types/api";

interface CartState {
  lines: CartLine[];
  /** When set, the cart is editing this existing pending order (PATCH/replace)
   *  instead of placing a new one (POST/merge). */
  editingOrderId: number | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  add: (product: Product, qty?: number) => void;
  setQty: (productId: number, qty: number) => void;
  remove: (productId: number) => void;
  load: (lines: CartLine[], editingOrderId?: number | null) => void;
  clear: () => void;
  qtyOf: (productId: number) => number;
  itemCount: () => number;
  subtotal: () => number;
}

function persist(lines: CartLine[]): void {
  void secureStorage.setItem(StorageKeys.cart, JSON.stringify(lines));
}

function lineFromProduct(product: Product, quantity: number): CartLine {
  return {
    product_id: product.product_id,
    product_name: product.product_name,
    product_image: product.product_image,
    company_name: product.company_name,
    selling_price: product.selling_price,
    mrp: product.mrp,
    quantity,
    stock_quantity: product.stock_quantity,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  editingOrderId: null,
  hydrated: false,

  hydrate: async () => {
    try {
      const raw = await secureStorage.getItem(StorageKeys.cart);
      if (raw) set({ lines: JSON.parse(raw) as CartLine[] });
    } catch {
      // ignore corrupt cart
    } finally {
      set({ hydrated: true });
    }
  },

  add: (product, qty = 1) => {
    const lines = [...get().lines];
    const i = lines.findIndex((l) => l.product_id === product.product_id);
    if (i >= 0) {
      const existing = lines[i];
      if (existing) lines[i] = { ...existing, quantity: existing.quantity + qty };
    } else {
      lines.push(lineFromProduct(product, qty));
    }
    set({ lines });
    persist(lines);
  },

  setQty: (productId, qty) => {
    let lines = [...get().lines];
    if (qty <= 0) {
      lines = lines.filter((l) => l.product_id !== productId);
    } else {
      lines = lines.map((l) => (l.product_id === productId ? { ...l, quantity: qty } : l));
    }
    set({ lines });
    persist(lines);
  },

  remove: (productId) => {
    const lines = get().lines.filter((l) => l.product_id !== productId);
    set({ lines });
    persist(lines);
  },

  load: (lines, editingOrderId = null) => {
    set({ lines, editingOrderId });
    persist(lines);
  },

  clear: () => {
    set({ lines: [], editingOrderId: null });
    persist([]);
  },

  qtyOf: (productId) => get().lines.find((l) => l.product_id === productId)?.quantity ?? 0,
  itemCount: () => get().lines.reduce((n, l) => n + l.quantity, 0),
  subtotal: () => get().lines.reduce((s, l) => s + l.selling_price * l.quantity, 0),
}));
