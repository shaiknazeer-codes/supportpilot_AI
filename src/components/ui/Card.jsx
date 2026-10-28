"use client";

import { motion } from "framer-motion";

/**
 * Reusable glass-morphism card with hover glow and optional gradient border.
 */
export default function Card({
  children,
  className = "",
  hover = true,
  gradientBorder = false,
  glow = false,
  ...props
}) {
  return (
    <motion.div
      className={`
        glass-card p-6 
        ${gradientBorder ? "gradient-border" : ""}
        ${glow ? "glow-violet" : ""}
        ${className}
      `}
      whileHover={
        hover
          ? {
              y: -4,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }
          : {}
      }
      {...props}
    >
      {children}
    </motion.div>
  );
}
