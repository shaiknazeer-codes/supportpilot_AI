"use client";

/**
 * Decorative glow orb for background ambience.
 */
export default function GlowOrb({
  color = "violet",
  size = 400,
  className = "",
  blur = 120,
  opacity = 0.12,
}) {
  const colors = {
    violet: "rgba(139, 92, 246,",
    cyan: "rgba(6, 182, 212,",
    mixed: "rgba(100, 120, 230,",
  };

  return (
    <div
      className={`absolute rounded-full pointer-events-none ${className}`}
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${colors[color]} ${opacity}) 0%, transparent 70%)`,
        filter: `blur(${blur}px)`,
      }}
      aria-hidden="true"
    />
  );
}
