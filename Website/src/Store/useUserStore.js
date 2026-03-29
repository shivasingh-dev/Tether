import { create } from "zustand";
import { persist } from "zustand/middleware";



const useUserState = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      setUser: (userData) => set({ user: userData, isAuthenticated: true }),
      clearUser: () => set({ user: null, isAuthenticated: false })
    }),
    {
      name: "user-data-storage",
      getStorage: () => localStorage
    }
  )
)


export default useUserState