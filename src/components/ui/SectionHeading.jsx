"use client";

/**
 * Reusable section heading with badge, title, and description.
 * Uses GSAP ScrollTrigger via parent for reveal animation.
 */
export default function SectionHeading({
  badge,
  title,
  description,
  align = "center",
  className = "",
}) {
  const alignClasses = {
    center: "text-center mx-auto",
    left: "text-left",
  };

  return (
    <div className={`max-w-3xl mb-16 ${alignClasses[align]} ${className}`}>
      {badge && (
        <span className="inline-flex items-center gap-2 px-4 py-1.5 mb-6 text-xs font-medium tracking-wider uppercase rounded-full bg-accent-violet/10 text-accent-violet-light border border-accent-violet/20">
          {badge}
        </span>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-text-primary leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-5 text-base sm:text-lg text-text-secondary leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
