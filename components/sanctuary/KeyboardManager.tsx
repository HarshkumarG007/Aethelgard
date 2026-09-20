"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface KeyboardManagerProps {
  isHelpOpen: boolean;
  onToggleHelp: () => void;
  onCloseHelp: () => void;
}

export function KeyboardManager({
  isHelpOpen,
  onToggleHelp,
  onCloseHelp,
}: KeyboardManagerProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Never intercept when user holds modifier keys
      if (event.ctrlKey || event.metaKey || event.altKey) {
        return;
      }

      // Handle Escape context-sensitively
      if (event.key === "Escape") {
        if (isHelpOpen) {
          event.preventDefault();
          onCloseHelp();
          return;
        }
        return;
      }

      // Handle Help shortcut '?'
      if (event.key === "?") {
        const target = event.target as HTMLElement | null;
        const tagName = target?.tagName?.toLowerCase();
        const isTextInput =
          tagName === "input" ||
          tagName === "textarea" ||
          target?.isContentEditable;

        if (!isTextInput) {
          event.preventDefault();
          onToggleHelp();
          return;
        }
      }

      // Check if focus is inside any interactive control or active modal
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const tagName = target.tagName.toLowerCase();
      const isInteractive =
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select" ||
        tagName === "button" ||
        tagName === "a" ||
        target.isContentEditable ||
        target.closest("[role='dialog']") !== null;

      if (isInteractive || isHelpOpen) {
        return;
      }

      // Sanctuary navigation shortcuts
      switch (event.key.toLowerCase()) {
        case "o":
          event.preventDefault();
          router.push("/");
          break;
        case "t":
          event.preventDefault();
          router.push("/timeline");
          break;
        case "l":
          event.preventDefault();
          router.push("/letters");
          break;
        case "a":
          event.preventDefault();
          router.push("/archive");
          break;
        case "h":
          event.preventDefault();
          router.push("/horizon");
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router, isHelpOpen, onToggleHelp, onCloseHelp]);

  return null;
}
