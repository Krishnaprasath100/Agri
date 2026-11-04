'use client';

import React, { useRef } from 'react';
import { CalendarDays } from 'lucide-react';

interface DateFieldProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  placeholder?: string;
}

/** Date input with a visible calendar control for desktop and mobile users. */
export function DateField({ placeholder = 'dd-mm-yyyy', className, ...props }: DateFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const openCalendar = () => {
    const input = inputRef.current as HTMLInputElement & { showPicker?: () => void };
    input?.focus();
    try {
      input?.showPicker?.();
    } catch {
      // Browser does not support showPicker or gesture blocked
    }
  };

  const hasValue = Boolean(props.value && String(props.value).trim().length > 0);

  return (
    <div className="date-field">
      <input
        {...props}
        ref={inputRef}
        type="date"
        placeholder={placeholder}
        className={`form-input date-field-input ${hasValue ? 'has-value' : ''} ${className || ''}`}
      />
      {!hasValue && (
        <span className="date-field-placeholder" aria-hidden="true">
          {placeholder}
        </span>
      )}
      <button type="button" className="date-field-button" aria-label="Open calendar" onClick={openCalendar}>
        <CalendarDays size={18} />
      </button>
    </div>
  );
}
