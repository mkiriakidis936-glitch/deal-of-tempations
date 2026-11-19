import toast from "react-hot-toast";

// Minimal compatibility wrapper: toast({ title, description, variant })
export function useToast() { return { toast: showToast }; }

function showToast({ title, description, variant } = {}) {
  const msg = [title, description].filter(Boolean).join(" — ");
  return variant === "destructive" ? toast.error(msg) : toast(msg);
}
export { showToast as toast };
