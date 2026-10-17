import { createContext, useContext } from 'react'
import type { Size } from '../types'

/** What a CheckboxGroup tells each Checkbox inside it. Facts flow down only. Internal. */
export interface CheckboxGroupContextValue {
  /** The chosen values. A Checkbox with a `value` is checked when its value is here. */
  value: readonly string[]
  /** A box with a `value` was ticked or cleared. */
  toggle: (option: string, checked: boolean) => void
  /** Posted by every box with a `value`, once per chosen box. */
  name: string | undefined
  size: Size
  /** The group's `invalid`, or its Field's error. */
  invalid: boolean
  /** The Field's error sentence while it has one: every box is described by it too. */
  errorId: string | undefined
  /** Required by its Field, nothing chosen, not invalid: the caution edge on every box. */
  caution: boolean
  disabled: boolean
  readOnly: boolean
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null)

/** The CheckboxGroup around this Checkbox, or null. Internal. */
export function useCheckboxGroup(): CheckboxGroupContextValue | null {
  return useContext(CheckboxGroupContext)
}
