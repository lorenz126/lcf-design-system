import { type ComponentPropsWithRef, type ReactNode } from 'react';
import { type FieldContextValue } from '../Field/context';
import type { Size } from '../types';
/** The text types. Numbers, dates and search have components of their own. */
export type InputType = 'text' | 'email' | 'tel' | 'url' | 'password';
export interface InputProps extends Omit<ComponentPropsWithRef<'input'>, 'size' | 'type' | 'maxLength'> {
    /** The text types. Numbers, dates and search have components of their own. Default 'text'. */
    type?: InputType;
    /** 22, 26 or 32px, matching Button. Inside a Field, the Field's size unless set here. Default 'md'. */
    size?: Size;
    /** For a field whose words live elsewhere (a table cell with a summary). Inside a Field, Field's `error` sets it. */
    invalid?: boolean;
    /** Full width of its container. Default false. */
    block?: boolean;
    /** Before the text: an icon, a prefix. Clicking it focuses the input unless it is a control itself. */
    startAdornment?: ReactNode;
    /** After the text: a unit, a button. */
    endAdornment?: ReactNode;
}
/** What NumberField needs beyond Input's props. Internal. */
export interface InputFrameProps extends InputProps {
    /** Extra attributes on the frame — NumberField's `data-dirty`. */
    frameProps?: Record<`data-${string}`, string | undefined>;
    /** Replaces aria-labelledby: NumberField names itself "label + unit". */
    labelledBy?: string;
    /** Overrides how emptiness is read. NumberField counts whitespace as empty; Input does not. */
    empty?: boolean;
}
/**
 * The Field contract's arithmetic, once, for every control built on the
 * frame (NumberField reads it too, for its stepper and its hidden input):
 * the control's own size wins, then the Field's, then 'md'; required,
 * disabled and read-only are OR'ed.
 */
export declare function resolveControl(field: FieldContextValue | null, own: {
    size?: Size;
    required?: boolean;
    disabled?: boolean;
    readOnly?: boolean;
}): {
    size: Size;
    required: boolean;
    disabled: boolean;
    readOnly: boolean;
};
/**
 * The box every one-line control is drawn in, and the Field contract
 * (`useField`'s doc comment) kept once: Input is this with nothing
 * added, NumberField builds on it. Internal.
 */
export declare function InputFrame({ type, size: sizeProp, invalid: invalidProp, block, startAdornment, endAdornment, frameProps, labelledBy, empty: emptyProp, className, style, id: idProp, required: requiredProp, disabled: disabledProp, readOnly: readOnlyProp, value, defaultValue, onChange, ref, ...rest }: InputFrameProps): import("react").JSX.Element;
