import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";



const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (data) => set({ user: data, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: "user-auth-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
)


export default useUserStore