"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * FuturisticBackground
 * 
 * Luminous, attractive AI SaaS animated background:
 * 1. Rich violet, cyan, indigo, and magenta glowing ambient orbs with fluid orbital drift.
 * 2. GSAP ScrollTrigger parallax depth layers that shift smoothly on scroll.
 * 3. Interactive smooth cursor spotlight glow (lerped mouse follower).
 * 4. Neural constellation particle canvas (stars + connecting synaptic lines + gentle mouse repulsion).
 * 5. High-tech cyber grid pattern with radial vignette mask.
 * 
 * Performance & Accessibility:
 * - Completely non-blocking (pointer-events: none, z-0 under relative z-10 content).
 * - Pauses animation loop when tab is backgrounded.
 * - Full prefers-reduced-motion support.
 */
export default function FuturisticBackground() {
  const containerRef = useRef(null);
  const orb1Ref = useRef(null);
  const orb2Ref = useRef(null);
  const orb3Ref = useRef(null);
  const orb4Ref = useRef(null);
  const gridRef = useRef(null);
  const canvasRef = useRef(null);
  const mouseGlowRef = useRef(null);

  useEffect(() => {
    const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // ── 1. GSAP ScrollTrigger Parallax ──
    const ctx = gsap.context(() => {
      if (!prefersReduced) {
        if (orb1Ref.current) {
          gsap.to(orb1Ref.current, {
            yPercent: 40,
            xPercent: -15,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.4,
            },
          });
        }

        if (orb2Ref.current) {
          gsap.to(orb2Ref.current, {
            yPercent: -45,
            xPercent: 18,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.6,
            },
          });
        }

        if (orb3Ref.current) {
          gsap.to(orb3Ref.current, {
            yPercent: 50,
            xPercent: 20,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.8,
            },
          });
        }

        if (orb4Ref.current) {
          gsap.to(orb4Ref.current, {
            yPercent: -35,
            xPercent: -18,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: "bottom bottom",
              scrub: 1.3,
            },
          });
        }

        if (gridRef.current) {
          gsap.to(gridRef.current, {
            yPercent: 10,
            ease: "none",
            scrollTrigger: {
              trigger: document.body,
              start: "top top",
              end: "bottom bottom",
              scrub: 1,
            },
          });
        }
      }
    }, containerRef);

    // ── 2. Interactive Cursor Follower Spotlight ──
    let targetX = window.innerWidth / 2;
    let targetY = window.innerHeight / 3;
    let currentX = targetX;
    let currentY = targetY;
    let mouseRafId = null;

    const handleMouseMove = (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    };

    const updateMouseGlow = () => {
      currentX += (targetX - currentX) * 0.08;
      currentY += (targetY - currentY) * 0.08;

      if (mouseGlowRef.current) {
        mouseGlowRef.current.style.transform = `translate3d(${currentX - 250}px, ${currentY - 250}px, 0)`;
      }

      if (!prefersReduced) {
        mouseRafId = requestAnimationFrame(updateMouseGlow);
      }
    };

    if (!prefersReduced) {
      window.addEventListener("mousemove", handleMouseMove, { passive: true });
      mouseRafId = requestAnimationFrame(updateMouseGlow);
    }

    // ── 3. Neural Synapse / Constellation Particles Canvas ──
    const canvas = canvasRef.current;
    let particleRafId = null;

    if (canvas) {
      const ctx2d = canvas.getContext("2d");
      let width = (canvas.width = window.innerWidth);
      let height = (canvas.height = window.innerHeight);

      const handleResize = () => {
        if (!canvas) return;
        width = canvas.width = window.innerWidth;
        height = canvas.height = window.innerHeight;
      };

      window.addEventListener("resize", handleResize, { passive: true });

      // Configuration: 46 constellation nodes
      const COUNT = 46;
      const particles = [];
      const colors = [
        { r: 139, g: 92, b: 246 },  // violet
        { r: 6, g: 182, b: 212 },   // cyan
        { r: 167, g: 139, b: 250 }, // light violet
        { r: 34, g: 211, b: 238 },  // light cyan
      ];

      for (let i = 0; i < COUNT; i++) {
        const color = colors[Math.floor(Math.random() * colors.length)];
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(Math.random() * 0.3 + 0.1),
          radius: Math.random() * 1.8 + 0.8,
          baseAlpha: Math.random() * 0.35 + 0.2,
          alpha: 0.3,
          color,
          pulse: Math.random() * Math.PI * 2,
          pulseSpeed: Math.random() * 0.02 + 0.01,
        });
      }

      const render = () => {
        ctx2d.clearRect(0, 0, width, height);

        // Update and draw particles
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];

          if (!prefersReduced) {
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += p.pulseSpeed;
            p.alpha = p.baseAlpha + Math.sin(p.pulse) * 0.15;

            // Gentle repulsion from cursor
            const dx = p.x - targetX;
            const dy = p.y - targetY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 120 && dist > 0) {
              const force = (120 - dist) / 120;
              p.x += (dx / dist) * force * 1.2;
              p.y += (dy / dist) * force * 1.2;
            }

            // Screen wrap
            if (p.y < -10) {
              p.y = height + 10;
              p.x = Math.random() * width;
            }
            if (p.x < -10) p.x = width + 10;
            if (p.x > width + 10) p.x = -10;
          }

          // Draw node
          ctx2d.beginPath();
          ctx2d.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
          ctx2d.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${Math.max(0.08, Math.min(0.7, p.alpha))})`;
          ctx2d.fill();

          // Connect adjacent particles with subtle synaptic lines
          for (let j = i + 1; j < particles.length; j++) {
            const p2 = particles[j];
            const lineDx = p.x - p2.x;
            const lineDy = p.y - p2.y;
            const lineDist = Math.sqrt(lineDx * lineDx + lineDy * lineDy);

            if (lineDist < 95) {
              const lineAlpha = (1 - lineDist / 95) * 0.16;
              ctx2d.beginPath();
              ctx2d.moveTo(p.x, p.y);
              ctx2d.lineTo(p2.x, p2.y);
              ctx2d.strokeStyle = `rgba(139, 92, 246, ${lineAlpha})`;
              ctx2d.lineWidth = 0.8;
              ctx2d.stroke();
            }
          }
        }

        if (!prefersReduced) {
          particleRafId = requestAnimationFrame(render);
        }
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          if (particleRafId) cancelAnimationFrame(particleRafId);
          if (mouseRafId) cancelAnimationFrame(mouseRafId);
        } else if (!prefersReduced) {
          particleRafId = requestAnimationFrame(render);
          mouseRafId = requestAnimationFrame(updateMouseGlow);
        }
      };

      document.addEventListener("visibilitychange", handleVisibilityChange);
      render();

      return () => {
        if (particleRafId) cancelAnimationFrame(particleRafId);
        if (mouseRafId) cancelAnimationFrame(mouseRafId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("visibilitychange", handleVisibilityChange);
        ctx.revert();
      };
    }

    return () => {
      if (mouseRafId) cancelAnimationFrame(mouseRafId);
      window.removeEventListener("mousemove", handleMouseMove);
      ctx.revert();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
      aria-hidden="true"
    >
      {/* ── Base Ambient Deep Canvas ── */}
      <div
        className="absolute inset-0 bg-[#07070a]"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 0%, rgba(139, 92, 246, 0.12) 0%, transparent 65%),
            radial-gradient(circle at 100% 45%, rgba(6, 182, 212, 0.10) 0%, transparent 55%),
            radial-gradient(circle at 0% 90%, rgba(99, 102, 241, 0.11) 0%, transparent 60%)
          `,
        }}
      />

      {/* ── Layer 1: Luminous Floating Glowing Orbs ── */}
      {/* Orb 1: Violet / Neon Purple (Top Left) */}
      <div
        ref={orb1Ref}
        className="absolute top-[-12%] left-[-8%] w-[700px] h-[700px] rounded-full blur-[90px] opacity-80 animate-ambient-drift-1"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.38) 0%, rgba(124, 58, 237, 0.18) 45%, transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* Orb 2: Electric Cyan / Aqua Glow (Center Right) */}
      <div
        ref={orb2Ref}
        className="absolute top-[22%] right-[-10%] w-[680px] h-[680px] rounded-full blur-[95px] opacity-75 animate-ambient-drift-2"
        style={{
          background:
            "radial-gradient(circle, rgba(6, 182, 212, 0.34) 0%, rgba(14, 165, 233, 0.16) 45%, transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* Orb 3: Deep Indigo / Cobalt Beam (Bottom Left) */}
      <div
        ref={orb3Ref}
        className="absolute bottom-[8%] left-[-10%] w-[620px] h-[620px] rounded-full blur-[100px] opacity-70 animate-ambient-drift-3"
        style={{
          background:
            "radial-gradient(circle, rgba(99, 102, 241, 0.32) 0%, rgba(79, 70, 229, 0.15) 50%, transparent 75%)",
          willChange: "transform",
        }}
      />

      {/* Orb 4: Electric Magenta / Pinkish Violet (Bottom Right / Center) */}
      <div
        ref={orb4Ref}
        className="absolute bottom-[-10%] right-[12%] w-[580px] h-[580px] rounded-full blur-[90px] opacity-65 animate-ambient-drift-4"
        style={{
          background:
            "radial-gradient(circle, rgba(217, 70, 239, 0.28) 0%, rgba(168, 85, 247, 0.14) 45%, transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* ── Layer 2: Interactive Mouse Follower Spotlight Glow ── */}
      <div
        ref={mouseGlowRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full blur-[85px] pointer-events-none opacity-45"
        style={{
          background:
            "radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(6, 182, 212, 0.14) 40%, transparent 70%)",
          willChange: "transform",
        }}
      />

      {/* ── Layer 3: High-Tech Cyber Grid Overlay ── */}
      <div
        ref={gridRef}
        className="absolute inset-[-15%] opacity-45 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(139, 92, 246, 0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(6, 182, 212, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(ellipse 85% 70% at 50% 45%, black 25%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 85% 70% at 50% 45%, black 25%, transparent 80%)",
        }}
      />

      {/* ── Layer 4: Neural Synapse Constellation Canvas ── */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />

      {/* ── Layer 5: Soft Vignette Framing ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, transparent 45%, rgba(7, 7, 10, 0.5) 100%)",
        }}
      />
    </div>
  );
}
