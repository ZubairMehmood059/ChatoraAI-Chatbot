import React from 'react';
import { motion } from 'motion/react';

interface AiBreathingOrbProps {
  size?: number;
  className?: string;
}

export const AiBreathingOrb: React.FC<AiBreathingOrbProps> = ({ size = 76, className = '' }) => {
  return (
    <div
      className={`relative flex items-center justify-center shrink-0 select-none ${className}`}
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Ambient Radial Soft Glow */}
      <motion.div
        animate={{
          scale: [1, 1.14, 1],
          opacity: [0.35, 0.6, 0.35],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute -inset-2 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(215, 166, 74, 0.28) 0%, rgba(49, 92, 67, 0.15) 45%, transparent 72%)',
          filter: 'blur(10px)',
        }}
      />

      {/* Glass Sphere Shell with Refraction and Specular Rim */}
      <div
        className="relative w-full h-full rounded-full overflow-hidden flex items-center justify-center shadow-lg"
        style={{
          background: 'radial-gradient(circle at 35% 30%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.05) 40%, rgba(0, 0, 0, 0.25) 100%)',
          boxShadow: 'inset 0 1px 2px rgba(255, 255, 255, 0.4), inset 0 -2px 6px rgba(0, 0, 0, 0.4), 0 8px 24px -4px rgba(0, 0, 0, 0.2)',
          border: '1px solid rgba(255, 255, 255, 0.18)',
          backdropFilter: 'blur(4px)',
        }}
      >
        {/* Living Swirling Iris Core */}
        <motion.div
          animate={{
            rotate: [0, 180, 360],
            scale: [0.88, 1.04, 0.88],
          }}
          transition={{
            rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
            scale: { duration: 3.8, repeat: Infinity, ease: 'easeInOut' },
          }}
          className="absolute w-[68%] h-[68%] rounded-full opacity-90"
          style={{
            background: 'conic-gradient(from 45deg, #D7A64A, #315C43, #A7B7A0, #D7A64A)',
            filter: 'blur(5px)',
          }}
        />

        {/* Inner Eye / Focal Center */}
        <motion.div
          animate={{
            scale: [0.92, 1.08, 0.92],
            opacity: [0.75, 1, 0.75],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative z-10 w-[36%] h-[36%] rounded-full shadow-inner"
          style={{
            background: 'radial-gradient(circle at 38% 36%, #FFF4D9 0%, #D7A64A 55%, #191D19 100%)',
            boxShadow: '0 0 10px rgba(215, 166, 74, 0.8)',
          }}
        />

        {/* Top-left Specular Glass Glare / Iris Reflection */}
        <div
          className="absolute top-1 left-2 w-[42%] h-[26%] rounded-full pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.65) 0%, rgba(255, 255, 255, 0) 80%)',
            transform: 'rotate(-25deg)',
          }}
        />

        {/* Bottom subtle secondary refraction reflection */}
        <div
          className="absolute bottom-1 right-2 w-[30%] h-[18%] rounded-full pointer-events-none opacity-40"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255, 255, 255, 0.45) 0%, transparent 75%)',
          }}
        />
      </div>
    </div>
  );
};
