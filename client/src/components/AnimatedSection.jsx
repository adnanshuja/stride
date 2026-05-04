import { motion } from 'framer-motion';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function FadeIn({ children, className, delay = 0, ...props }) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25, ease: 'easeOut', delay }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className, stagger = 0.05, delay = 0, ...props }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: {}, visible: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
      className={className}
      {...props}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <motion.div key={i} variants={fadeUp} transition={{ duration: 0.25, ease: 'easeOut' }}>
              {child}
            </motion.div>
          ))
        : children}
    </motion.div>
  );
}
