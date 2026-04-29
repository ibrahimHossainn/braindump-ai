import { useEffect, useState } from "react";

export interface ToastMessage {
  id: number;
  text: string;
}

let _id = 0;
type Listener = (t: ToastMessage) => void;
const listeners = new Set<Listener>();

export function toast(text: string): void {
  const msg: ToastMessage = { id: ++_id, text };
  listeners.forEach((l) => l(msg));
}

export function ToastViewport() {
  const [items, setItems] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const onMsg: Listener = (m) => {
      setItems((prev) => [...prev, m]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== m.id));
      }, 1800);
    };
    listeners.add(onMsg);
    return () => {
      listeners.delete(onMsg);
    };
  }, []);

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
      {items.map((m) => (
        <div
          key={m.id}
          className="glass-card px-4 py-2.5 text-sm text-white border-neon-cyan/30 animate-scale-in pointer-events-auto"
        >
          {m.text}
        </div>
      ))}
    </div>
  );
}
