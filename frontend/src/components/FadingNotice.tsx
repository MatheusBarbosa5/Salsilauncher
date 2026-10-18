import React, { useEffect, useState } from "react";

// Aviso de sucesso que esmaece e some sozinho, como o banner de boas-vindas.
export function FadingNotice({
  message,
  onClear,
}: {
  message: string;
  onClear: () => void;
}) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!message) return;
    setVisible(true);
    const fade = window.setTimeout(() => setVisible(false), 4000);
    const clear = window.setTimeout(onClear, 4600);
    return () => {
      window.clearTimeout(fade);
      window.clearTimeout(clear);
    };
  }, [message]);

  if (!message) return null;

  return (
    <p
      role="status"
      className="online-success"
      style={{
        overflow: "hidden",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(-10px)",
        maxHeight: visible ? "80px" : "0px",
        paddingTop: visible ? undefined : 0,
        paddingBottom: visible ? undefined : 0,
        marginTop: visible ? undefined : 0,
        marginBottom: visible ? undefined : 0,
        transition:
          "opacity 0.6s ease, transform 0.6s ease, max-height 0.6s cubic-bezier(0.4, 0, 0.2, 1), padding 0.6s ease, margin 0.6s ease",
      }}
    >
      {message}
    </p>
  );
}
