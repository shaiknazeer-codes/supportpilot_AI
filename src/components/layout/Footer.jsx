"use client";

import Link from "next/link";
import { Bot, Globe, ExternalLink, Link2, Mail } from "lucide-react";

const footerLinks = {
  Product: [
    { label: "AI Assistant", href: "/chat" },
    { label: "Features", href: "/#features" },
    { label: "Dashboard", href: "/#dashboard" },
    { label: "Pricing", href: "/#cta" },
  ],
  Company: [
    { label: "About", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Contact", href: "#cta" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Support", href: "#" },
    { label: "Status", href: "#" },
  ],
};

const socialLinks = [
  { icon: ExternalLink, href: "#", label: "Twitter" },
  { icon: Globe, href: "#", label: "GitHub" },
  { icon: Link2, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main footer */}
        <div className="py-12 lg:py-16 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-4 lg:col-span-2 mb-4 lg:mb-0">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-violet to-accent-cyan flex items-center justify-center">
                <Bot className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-lg font-bold text-text-primary tracking-tight">
                SupportPilot<span className="gradient-text ml-0.5">AI</span>
              </span>
            </Link>
            <p className="text-sm text-text-muted leading-relaxed max-w-sm mb-6">
              AI-powered customer operations that listens, understands, acts, and resolves — so your team can focus on what matters.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  aria-label={social.label}
                  className="w-9 h-9 rounded-lg bg-white/[0.04] border border-border-subtle flex items-center justify-center text-text-muted hover:text-accent-violet-light hover:border-accent-violet/30 transition-all duration-200"
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-sm font-semibold text-text-primary mb-4 tracking-wide">
                {category}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-text-muted hover:text-text-secondary transition-colors duration-200"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="py-6 border-t border-border-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-text-muted">
            © 2026 SupportPilot AI. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-xs text-text-muted hover:text-text-secondary transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
