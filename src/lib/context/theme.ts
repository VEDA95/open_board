import { createContext, useContext } from "react"
import type { ThemeProviderState } from "@lib/types/theme"

const ThemeProviderContext = createContext<ThemeProviderState>({
  theme: "system",
  setTheme: (): void => {},
})

function useTheme(): ThemeProviderState {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")
  return context
}

export { ThemeProviderContext, useTheme }
