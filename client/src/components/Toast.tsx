import React, { useEffect } from 'react';

export default function Toast({
  message,
  onClose
}: {
  message: string | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!message) return;
    const t = window.setTimeout(onClose, 2400);
    return () => window.clearTimeout(t);
  }, [message, onClose]);

  if (!message) return null;
  return (
    <div className="toast" role="status">
      <div style={{ fontWeight: 900, marginBottom: 4 }}>Готово</div>
      <div style={{ fontSize: 13, color: '#3f3f46' }}>{message}</div>
    </div>
  );
}
