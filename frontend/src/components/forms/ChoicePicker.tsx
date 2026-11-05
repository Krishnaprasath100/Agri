'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, Search, X } from 'lucide-react';

export interface ChoicePickerOption {
  value: string;
  label: string;
  group?: string;
}

interface ChoicePickerProps {
  ariaLabel: string;
  value: string;
  options: ChoicePickerOption[];
  placeholder: string;
  onChange: (value: string) => void;
  allowCreate?: boolean;
  createPlaceholder?: string;
  onCreate?: (newValue: string) => void;
  className?: string;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onOpen?: () => void;
  onSkip?: () => void;
  skipLabel?: string;
}

/** A viewport-safe picker; native select menus can overflow mobile app frames. */
export function ChoicePicker({
  ariaLabel,
  value,
  options,
  placeholder,
  onChange,
  allowCreate = false,
  createPlaceholder = 'Search or type new...',
  onCreate,
  className,
  isOpen: controlledIsOpen,
  onOpenChange,
  onOpen,
  onSkip,
  skipLabel = 'Skip (Optional) →',
}: ChoicePickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof controlledIsOpen === 'boolean';
  const open = isControlled ? controlledIsOpen : internalOpen;

  const setOpen = (newVal: boolean | ((prev: boolean) => boolean)) => {
    const nextVal = typeof newVal === 'function' ? newVal(open) : newVal;
    if (!isControlled) {
      setInternalOpen(nextVal);
    }
    if (onOpenChange) {
      onOpenChange(nextVal);
    }
  };

  const [search, setSearch] = useState('');
  const rootRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    const closeOnOutsidePress = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', closeOnOutsidePress);
    document.addEventListener('touchstart', closeOnOutsidePress, { passive: true });
    return () => {
      document.removeEventListener('mousedown', closeOnOutsidePress);
      document.removeEventListener('touchstart', closeOnOutsidePress);
    };
  }, []);

  useEffect(() => {
    if (open) {
      if (onOpen) onOpen();
      // ONLY on mobile phones (<= 767px): scroll field smoothly to the top of viewport
      // so options open downwards in open space and keyboard stays at the bottom.
      // On Desktop and Tab (> 767px), do NOT scroll or alter page position!
      if (typeof window !== 'undefined' && window.innerWidth <= 767 && rootRef.current) {
        const rect = rootRef.current.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const targetY = scrollTop + rect.top - 8;
        window.scrollTo({ top: Math.max(0, targetY), behavior: 'smooth' });
      }

      if (allowCreate && searchInputRef.current) {
        setTimeout(() => searchInputRef.current?.focus(), 80);
      }
    } else {
      setSearch('');
    }
  }, [open, allowCreate, onOpen]);

  const trimmedSearch = search.trim();
  const filteredOptions = trimmedSearch
    ? options.filter((option) =>
        option.label.toLowerCase().includes(trimmedSearch.toLowerCase())
      )
    : options;

  const exactMatchExists = options.some(
    (option) => option.label.toLowerCase() === trimmedSearch.toLowerCase()
  );
  const canCreate = allowCreate && trimmedSearch.length > 0 && !exactMatchExists;

  const handleSelectOption = (val: string) => {
    onChange(val);
    setOpen(false);
    setSearch('');
  };

  const handleCreateNew = () => {
    if (!trimmedSearch) return;
    if (onCreate) {
      onCreate(trimmedSearch);
    } else {
      onChange(trimmedSearch);
    }
    setOpen(false);
    setSearch('');
  };

  let previousGroup: string | undefined;

  return (
    <div className={`choice-picker${className ? ` ${className}` : ''}`} ref={rootRef}>
      <button
        type="button"
        className={`choice-picker-trigger${open ? ' is-open' : ''}${
          selected || value ? '' : ' is-placeholder'
        }`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="choice-picker-label">{selected?.label || value || placeholder}</span>
        <ChevronDown
          size={18}
          aria-hidden="true"
          style={{
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {open && (
        <div className="choice-picker-menu" role="listbox" aria-label={ariaLabel}>
          {onSkip && (
            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '4px 8px 6px' }}>
              <button
                type="button"
                className="btn btn-secondary"
                style={{
                  padding: '3px 10px',
                  fontSize: '0.78rem',
                  borderRadius: 6,
                  fontWeight: 650,
                  height: 28,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onSkip();
                }}
              >
                {skipLabel}
              </button>
            </div>
          )}
          {allowCreate && (
            <div className="choice-picker-search-container">
              <div className="choice-picker-search-box">
                <Search size={15} className="choice-picker-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="choice-picker-search-input"
                  placeholder={createPlaceholder}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (canCreate) {
                        handleCreateNew();
                      } else if (filteredOptions.length > 0) {
                        handleSelectOption(filteredOptions[0].value);
                      }
                    }
                  }}
                />
                {search && (
                  <button
                    type="button"
                    className="choice-picker-search-clear"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {canCreate && (
                <button
                  type="button"
                  className="choice-picker-create-btn"
                  onClick={handleCreateNew}
                >
                  <Plus size={15} />
                  <span>
                    Add <strong>"{trimmedSearch}"</strong>
                  </span>
                </button>
              )}
            </div>
          )}

          <div className="choice-picker-options-list">
            {filteredOptions.length === 0 && !canCreate && (
              <div className="choice-picker-empty">No matching options found</div>
            )}

            {filteredOptions.map((option) => {
              const groupLabel =
                option.group && option.group !== previousGroup
                  ? option.group
                  : undefined;
              previousGroup = option.group;
              const isSelected = value === option.value;

              return (
                <React.Fragment key={option.value}>
                  {groupLabel && (
                    <div className="choice-picker-group">{groupLabel}</div>
                  )}
                  <button
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    className={`choice-picker-option${
                      isSelected ? ' is-selected' : ''
                    }`}
                    onClick={() => handleSelectOption(option.value)}
                  >
                    <span>{option.label}</span>
                    {isSelected && <Check size={16} aria-hidden="true" />}
                  </button>
                </React.Fragment>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
