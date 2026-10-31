"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const MotionLink = motion.create(Link);

/**
 * Reusable button component with multiple variants.
 * Supports: primary (gradient), secondary (glass), ghost, and outline.
 */
export default function Button({
  children,
  variant = "primary",
  size = "md",
  href,
  onClick,
  className = "",
  icon,
  ...props
}) {
  const baseClasses =
    "relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-300 cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet focus-visible:ring-offset-2 focus-visible:ring-offset-bg-primary disabled:opacity-50 disabled:cursor-not-allowed";

  const sizes = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-sm rounded-xl",
    lg: "px-8 py-4 text-base rounded-xl",
  };

  const variants = {
    primary:
      "bg-gradient-to-r from-accent-violet to-accent-cyan text-white shadow-lg shadow-accent-violet/25 hover:shadow-[0_0_28px_rgba(139,92,246,0.45)] hover:brightness-110",
    secondary:
      "bg-glass-bg backdrop-blur-xl border border-glass-border text-text-primary hover:border-accent-violet/50 hover:shadow-[0_0_20px_rgba(139,92,246,0.2)] hover:bg-white/[0.06]",
    ghost:
      "text-text-secondary hover:text-text-primary hover:bg-white/[0.04]",
    outline:
      "border border-border-accent text-accent-violet-light hover:bg-accent-violet/10 hover:border-accent-violet hover:shadow-[0_0_18px_rgba(139,92,246,0.2)]",
  };

  const classes = `${baseClasses} ${sizes[size]} ${variants[variant]} ${className}`;

  const motionProps = {
    whileHover: { scale: 1.03 },
    whileTap: { scale: 0.97 },
    transition: { type: "spring", stiffness: 400, damping: 25 },
  };

  if (href) {
    const isAnchor = href.startsWith("#");
    const isExternal =
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("mailto:");

    if (isExternal || isAnchor) {
      return (
        <motion.a
          href={href}
          onClick={onClick}
          className={classes}
          {...motionProps}
          {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...props}
        >
          {icon && <span className="w-4 h-4">{icon}</span>}
          {children}
        </motion.a>
      );
    }

    return (
      <MotionLink
        href={href}
        onClick={onClick}
        className={classes}
        {...motionProps}
        {...props}
      >
        {icon && <span className="w-4 h-4">{icon}</span>}
        {children}
      </MotionLink>
    );
  }

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={classes}
      {...motionProps}
      {...props}
    >
      {icon && <span className="w-4 h-4">{icon}</span>}
      {children}
    </motion.button>
  );
}
