import { useCallback, useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export const Dialog = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
}: DialogProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousActiveElement = useRef<Element | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focusableElements = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey && document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      previousActiveElement.current = document.activeElement;
      dialogRef.current.showModal();
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";

      const firstFocusable = dialogRef.current.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      firstFocusable?.focus();

      return () => {
        document.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        dialogRef.current?.close();
        if (previousActiveElement.current instanceof HTMLElement) {
          previousActiveElement.current.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDialogElement>) => {
      if (e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  const handleBackdropKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDialogElement>) => {
      if (e.key === "Enter" && e.target === dialogRef.current) {
        onClose();
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={cn(
        "bg-background text-foreground rounded-2xl p-6 max-w-md mx-auto shadow-2xl border backdrop:bg-black/60 animate-in zoom-in-95 fade-in duration-200",
        className
      )}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      aria-modal="true"
      aria-labelledby="dialog-title"
      aria-describedby={description ? "dialog-description" : undefined}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 id="dialog-title" className="text-lg font-semibold">
            {title}
          </h2>
          {description && (
            <p id="dialog-description" className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-8 w-8 -mr-2 -mt-2"
        >
          <FiX className="h-4 w-4" />
        </Button>
      </div>
      {children}
    </dialog>
  );
};
