import { ButtonHTMLAttributes, forwardRef } from "react"

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline"
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none"

    const variants = {
      default: "bg-[#0037DA] text-white hover:bg-[#0037DA]/90",
      destructive: "bg-[#C50F1F] text-white hover:bg-[#C50F1F]/90",
      outline:
        "border border-[#333333] bg-transparent text-[#CCCCCC] hover:bg-[#333333]",
    }

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      />
    )
  }
)

Button.displayName = "Button"
