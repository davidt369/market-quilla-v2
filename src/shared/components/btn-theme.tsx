"use client"

import { useTheme } from "next-themes"
import { HugeiconsIcon } from "@hugeicons/react"
import { Sun01Icon, Moon01Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/shared/components/ui/button"

export function BtnTheme() {
  const { resolvedTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <Button 
      variant="outline" 
      size="icon" 
      onClick={toggleTheme}
      className="rounded-xl border-border/60 hover:bg-muted/40 hover:text-primary transition-all duration-300 relative overflow-hidden"
    >
      <div className="relative size-5 flex items-center justify-center">
        <span className="absolute transition-all duration-300 dark:scale-0 dark:rotate-90 scale-100 rotate-0">
          <HugeiconsIcon icon={Sun01Icon} className="size-5 stroke-[2]" />
        </span>
        <span className="absolute transition-all duration-300 dark:scale-100 dark:rotate-0 scale-0 -rotate-90">
          <HugeiconsIcon icon={Moon01Icon} className="size-5 stroke-[2]" />
        </span>
      </div>
      <span className="sr-only">Boton de tema</span>
    </Button>
  )
}