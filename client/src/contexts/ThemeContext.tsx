import React, { createContext, useContext, useEffect, useState } from "react";

export type Theme = "apothecary" | "clinical" | "botanical";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  themes: Array<{ id: Theme; name: string; description: string }>;
}

const themes: ThemeContextType["themes"] = [
  {
    id: "apothecary",
    name: "Heritage Apothecary",
    description: "Forest, parchment and brass — credible, established and premium.",
  },
  {
    id: "clinical",
    name: "Clinical Nature / NMS Standard",
    description: "Navy, mineral blue and white — rigorous, precise and information-led.",
  },
  {
    id: "botanical",
    name: "Modern Botanical",
    description: "Deep canopy, sage and warm bone — balanced, distinctive and retail-ready.",
  },
];

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = "botanical",
}: {
  children: React.ReactNode;
  defaultTheme?: Theme;
  switchable?: boolean;
}) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("nms-proposal-theme") as Theme | null;
    return stored && themes.some(item => item.id === stored) ? stored : defaultTheme;
  });

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("nms-proposal-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used within ThemeProvider");
  return context;
}
