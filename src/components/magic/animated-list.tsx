"use client";

// AnimatedList — Magic UI pattern (MIT): staggered spring reveal for feeds.
import { motion } from "framer-motion";

export function AnimatedItem({ children, index = 0, className }: {
  children: React.ReactNode; index?: number; className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: Math.min(index * 0.04, 0.6), type: "spring", damping: 26, stiffness: 280 }}
    >
      {children}
    </motion.div>
  );
}
