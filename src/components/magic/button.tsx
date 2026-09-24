"use client";

// Premium POS button system — layered gradients, press physics, sheen.
import { motion } from "framer-motion";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "danger" | "success";

const styles: Record<Variant, string> = {
  primary: "ember-btn shimmer-btn font-bold",
  ghost: "btn-ghost font-semibold",
  danger: "btn-danger-ghost font-semibold",
  success:
    "font-semibold text-emerald-100 border border-emerald-400/40 bg-gradient-to-b from-emerald-400/20 to-emerald-600/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_8px_22px_-8px_rgba(52,211,153,0.5)] hover:border-emerald-300/60 transition-all duration-200 hover:-translate-y-px active:translate-y-0",
};

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
};

const sizes = {
  sm: "rounded-lg px-3 py-1.5 text-xs",
  md: "rounded-xl px-5 py-2.5 text-sm",
  lg: "rounded-xl px-6 py-3 text-sm",
};

export default function Button({ variant = "ghost", size = "md", className, children, ...rest }: Props) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      className={`${styles[variant]} ${sizes[size]} ${className ?? ""}`}
      {...(rest as object)}
    >
      {children}
    </motion.button>
  );
}

export function Tab({
  active, children, onClick, className,
}: {
  active: boolean; children: React.ReactNode; onClick: () => void; className?: string;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      data-active={active}
      className={`tab-pill rounded-full px-4 py-1.5 text-sm font-semibold ${className ?? ""}`}
    >
      {children}
    </motion.button>
  );
}
