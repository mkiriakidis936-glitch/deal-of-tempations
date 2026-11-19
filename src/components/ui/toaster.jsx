import { Toaster as HotToaster } from "react-hot-toast";

// iOS 27 · toast σε μορφή γυάλινης κάψουλας (μαύρο & χρυσό).
const toastStyle = {
  borderRadius: '999px',
  padding: '12px 18px',
  background: 'rgba(28,28,30,0.82)',
  color: '#F5F1E8',
  border: '1px solid rgba(255,255,255,0.12)',
  backdropFilter: 'blur(30px) saturate(180%)',
  WebkitBackdropFilter: 'blur(30px) saturate(180%)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 20px 50px -14px rgba(0,0,0,0.9)',
  fontWeight: 600,
  fontSize: '0.9rem',
};

export function Toaster() {
  return (
    <HotToaster
      position="top-center"
      toastOptions={{
        style: toastStyle,
        success: { iconTheme: { primary: '#E8C26B', secondary: '#000' } },
        error: { iconTheme: { primary: '#FF453A', secondary: '#000' } },
      }}
    />
  );
}
export default Toaster;
