"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface DropdownOption {
  label: string;
  value: string;
}

export interface DisclosureDropdownProps {
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  options: DropdownOption[];
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function DisclosureDropdown({
  value,
  onValueChange,
  placeholder = "Select option",
  options,
  disabled = false,
  className = "",
  triggerClassName = "",
}: DisclosureDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  const selectedLabel = options.find((opt) => opt.value === value)?.label || placeholder;

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [open]);

  return (
    <div ref={ref} className={`relative inline-block w-full ${className}`}>
      <motion.button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((v) => !v)}
        whileTap={{ scale: 0.98 }}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border-2 border-[#EEEEF2] bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:border-[#DDDDE0] disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-700 ${triggerClassName}`}
      >
        <span className="truncate text-left">{selectedLabel}</span>
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-gray-500 dark:text-zinc-400" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: "spring", bounce: 0, duration: 0.2 }}
            className="absolute top-full left-0 right-0 z-50 mt-2 overflow-hidden rounded-xl border-2 border-[#EEEEF2] bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="max-h-[300px] overflow-y-auto">
              {options.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  onClick={() => {
                    onValueChange?.(option.value);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-[#F6F5FA] dark:hover:bg-zinc-800 ${
                    value === option.value
                      ? "bg-blue-50 text-blue-600 font-semibold dark:bg-zinc-800/50 dark:text-blue-400"
                      : "text-gray-700 dark:text-zinc-200"
                  }`}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {value === option.value && (
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                  )}
                  <span className="flex-1">{option.label}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
