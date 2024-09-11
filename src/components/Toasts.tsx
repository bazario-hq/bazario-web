import { Toast, ToastContainer } from 'react-bootstrap';
import { useApp } from '../context/AppContext';

export function Toasts() {
  const { toasts, dismissToast } = useApp();
  return (
    <ToastContainer position="bottom-end" className="p-3 position-fixed">
      {toasts.map((t) => (
        <Toast key={t.id} bg={t.variant} onClose={() => dismissToast(t.id)}>
          <Toast.Body className={t.variant === 'info' ? '' : 'text-white'} role="status">
            {t.message}
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  );
}
