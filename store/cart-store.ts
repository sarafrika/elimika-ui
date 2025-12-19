import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type CartStore = {
  cartId: string | null;
  setCartId: (id: string | null) => void;
  clearCart: () => void;
};

export const useCartStore = create<CartStore>()(
  persist(
    set => ({
      cartId: null,
      setCartId: id => set({ cartId: id }),
      clearCart: () => set({ cartId: null }),
    }),
    {
      name: 'elimika-cart-storage',
    }
  )
);
