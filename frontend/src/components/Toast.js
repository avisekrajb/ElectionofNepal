import React, { useEffect } from 'react';

const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 2800);

    return () => clearTimeout(timer);
  }, [onClose]);

  const toastStyles = {
    success: { bg: "#10b981", icon: "✓" },
    error: { bg: "#ef4444", icon: "✕" },
    warn: { bg: "#f59e0b", icon: "⚠" },
    info: { bg: "#0ea5e9", icon: "i" },
  };

  const style = toastStyles[type] || toastStyles.info;

  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 10,
      background: `${style.bg}`,
      backdropFilter: "blur(12px)",
      borderRadius: 12,
      padding: "10px 13px",
      boxShadow: "0 6px 30px rgba(0,0,0,0.15)",
      animation: "toastSlide .3s cubic-bezier(.4,0,.2,1)",
      pointerEvents: "auto",
      marginBottom: 6
    }}>
      <div style={{
        width: 21,
        height: 21,
        borderRadius: "50%",
        background: "rgba(255,255,255,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 11,
        fontWeight: 700,
        flexShrink: 0,
        color: "#fff"
      }}>
        {style.icon}
      </div>
      <span style={{
        fontSize: 12,
        color: "#fff",
        fontWeight: 500,
        lineHeight: 1.35
      }}>
        {message}
      </span>
    </div>
  );
};

export default Toast;