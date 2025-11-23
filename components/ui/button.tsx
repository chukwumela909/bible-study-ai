import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline"
  size?: "sm" | "md" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    const variants = {
      primary: "bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 hover:shadow-primary/30 border-none",
      secondary: "bg-secondary text-secondary-foreground border border-border hover:bg-secondary/80 shadow-sm",
      outline: "border border-border text-foreground hover:bg-accent/50",
      ghost: "hover:bg-accent/50 text-foreground",
    }
    
    const sizes = {
      sm: "h-8 px-4 text-xs",
      md: "h-10 px-6 text-sm",
      lg: "h-12 px-8 text-base",
      icon: "h-10 w-10 p-2",
    }

    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-full font-medium transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:pointer-events-none ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 cursor-pointer",
          variants[variant],
          sizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
