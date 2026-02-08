import React from 'react'
import { Button } from './button'
import { Loader2 } from 'lucide-react'

interface LegacyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
}

export function LegacyButton({ isLoading, children, disabled, ...props }: LegacyButtonProps) {
  return (
    <Button {...props} disabled={disabled || isLoading}>
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {children}
    </Button>
  )
}
