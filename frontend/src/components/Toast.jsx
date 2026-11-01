import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ message, type = "success", onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message) return null;

  const isError = type === "error";
  const isInfo = type === "info";

  return (
    <div
      className={`toast-container ${
        isError ? "toast-error" : isInfo ? "toast-info" : "toast-success"
      }`}
      role="alert"
    >
      <div className="toast-icon">
        {isError ? (
          <AlertCircle size={18} />
        ) : isInfo ? (
          <Info size={18} />
        ) : (
          <CheckCircle2 size={18} />
        )}
      </div>
      <div className="toast-content">{message}</div>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Close notification"
      >
        <X size={15} />
      </button>
    </div>
  );
}
