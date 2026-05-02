import { useEffect, useState } from "react";
import atmosphereImg from "@/assets/atmosphere.jpg";

export function PageLoader({
  label = "A moment",
  minMs = 4000,
  onFinish,
}: {
  label?: string;
  minMs?: number;
  onFinish?: () => void;
}) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), minMs - 800);
    const t2 = setTimeout(() => {
      setVisible(false);
      onFinish?.();
    }, minMs);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [minMs, onFinish]);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background"
      style={{
        opacity: fading ? 0 : 1,
        transition: "opacity 800ms ease-out",
      }}
    >
      <img
        src={atmosphereImg}
        alt=""
        width={1920}
        height={1080}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-30"
      />
      <div className="relative z-10 flex flex-col items-center gap-10">
        <div
          className="h-px w-32 bg-lamp/40"
          style={{ animation: "breathe 3s ease-in-out infinite" }}
        />
        <p className="font-display text-3xl italic text-ink/90">{label}</p>
        <p className="smallcaps text-muted-foreground/60">MindHaven</p>
      </div>
    </div>
  );
}

export function InlineLoader() {
  return (
    <div className="flex items-center justify-center py-20">
      <p className="font-display text-lg italic text-muted-foreground/70" style={{ animation: "breathe 3s ease-in-out infinite" }}>
        A moment…
      </p>
    </div>
  );
}
