"use client";

import { playSound } from "@/lib/sound";

type SoundName = Parameters<typeof playSound>[0];

export default function SoundButton({
  sound = "click",
  className,
  children,
  name,
  value,
  style,
  disabled,
}: {
  sound?: SoundName;
  className?: string;
  children: React.ReactNode;
  name?: string;
  value?: string;
  style?: React.CSSProperties;
  disabled?: boolean;
}) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      style={style}
      disabled={disabled}
      onClick={() => playSound(sound)}
    >
      {children}
    </button>
  );
}
