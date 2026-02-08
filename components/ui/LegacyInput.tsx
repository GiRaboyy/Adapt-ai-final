import React from 'react'
import { Input } from './input'
import { Label } from './label'

interface LegacyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  showPasswordToggle?: boolean
}

export function LegacyInput({ label, showPasswordToggle, className, ...props }: LegacyInputProps) {
  // showPasswordToggle is ignored for now - could implement later if needed
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={props.id}>{label}</Label>}
      <Input {...props} className={className} />
    </div>
  )
}
