import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

type ConfettiType = 'achievement' | 'milestone' | 'completion' | 'celebration';

interface ConfettiProps {
  type?: ConfettiType;
  duration?: number; // in milliseconds
  particleCount?: number;
  spread?: number;
  origin?: { x: number; y: number };
  colors?: string[];
  trigger?: boolean; // Use this to control when confetti shoots
}

// Preset configurations for different celebration types
const confettiPresets = {
  achievement: {
    particleCount: 100,
    spread: 70,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#5D5FEF', '#3ABFF8', '#36D399', '#FBBD23']
  },
  milestone: {
    particleCount: 150,
    spread: 100,
    origin: { x: 0.5, y: 0.7 },
    colors: ['#FF5757', '#3ABFF8', '#FBBD23', '#FB7185']
  },
  completion: {
    particleCount: 200,
    spread: 160,
    origin: { x: 0.5, y: 0.5 },
    colors: ['#36D399', '#5D5FEF', '#FBBD23', '#3ABFF8']
  },
  celebration: {
    particleCount: 250,
    spread: 180,
    origin: { x: 0.5, y: 0.3 },
    colors: ['#FBBD23', '#FF5757', '#36D399', '#3ABFF8', '#5D5FEF']
  }
};

export function Confetti({
  type = 'celebration',
  duration = 3000,
  particleCount,
  spread,
  origin,
  colors,
  trigger = false
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null);

  useEffect(() => {
    // Create a confetti canvas instance if it doesn't exist
    if (!confettiInstanceRef.current && canvasRef.current) {
      confettiInstanceRef.current = confetti.create(canvasRef.current, {
        resize: true,
        useWorker: true // Use a separate worker thread for better performance
      });
    }
    
    // Clean up on unmount
    return () => {
      if (confettiInstanceRef.current) {
        confettiInstanceRef.current.reset();
      }
    };
  }, []);

  useEffect(() => {
    // Only shoot confetti when the trigger prop is true
    if (trigger && confettiInstanceRef.current) {
      const preset = confettiPresets[type];
      
      confettiInstanceRef.current({
        particleCount: particleCount || preset.particleCount,
        spread: spread || preset.spread,
        origin: origin || preset.origin,
        colors: colors || preset.colors,
        startVelocity: 30,
        gravity: 0.9,
        ticks: 200,
        shapes: ['square', 'circle'],
        scalar: 1
      });
      
      // For more dramatic celebrations, add a second burst
      if (type === 'completion' || type === 'celebration') {
        setTimeout(() => {
          if (confettiInstanceRef.current) {
            confettiInstanceRef.current({
              particleCount: particleCount || preset.particleCount,
              spread: spread || preset.spread,
              origin: { x: 0.3, y: 0.5 },
              colors: colors || preset.colors,
              startVelocity: 35,
              gravity: 1.2,
              ticks: 200
            });
          }
        }, 250);
        
        setTimeout(() => {
          if (confettiInstanceRef.current) {
            confettiInstanceRef.current({
              particleCount: particleCount || preset.particleCount,
              spread: spread || preset.spread,
              origin: { x: 0.7, y: 0.5 },
              colors: colors || preset.colors,
              startVelocity: 35,
              gravity: 1.2,
              ticks: 200
            });
          }
        }, 500);
      }
      
      // Automatically reset after the specified duration
      const timer = setTimeout(() => {
        if (confettiInstanceRef.current) {
          confettiInstanceRef.current.reset();
        }
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [trigger, type, duration, particleCount, spread, origin, colors]);

  return (
    <canvas 
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Hook for imperatively triggering confetti without needing to manage state
export function useConfetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiRef = useRef<confetti.CreateTypes | null>(null);
  
  useEffect(() => {
    if (!canvasRef.current) {
      // Create a new canvas element if it doesn't exist
      const canvas = document.createElement('canvas');
      canvas.style.position = 'fixed';
      canvas.style.inset = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';
      document.body.appendChild(canvas);
      canvasRef.current = canvas;
      
      // Create confetti instance
      confettiRef.current = confetti.create(canvas, {
        resize: true,
        useWorker: true
      });
    }
    
    // Clean up on unmount
    return () => {
      if (canvasRef.current) {
        document.body.removeChild(canvasRef.current);
        canvasRef.current = null;
      }
      if (confettiRef.current) {
        confettiRef.current.reset();
        confettiRef.current = null;
      }
    };
  }, []);
  
  const triggerConfetti = (options: Partial<ConfettiProps> = {}) => {
    if (!confettiRef.current) return;
    
    const type = options.type || 'celebration';
    const preset = confettiPresets[type];
    
    confettiRef.current({
      particleCount: options.particleCount || preset.particleCount,
      spread: options.spread || preset.spread,
      origin: options.origin || preset.origin,
      colors: options.colors || preset.colors,
      startVelocity: 30,
      gravity: 0.9,
      ticks: 200,
      shapes: ['square', 'circle'],
      scalar: 1
    });
    
    // For more dramatic celebrations, add additional bursts
    if (type === 'completion' || type === 'celebration') {
      setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current({
            particleCount: options.particleCount || preset.particleCount,
            spread: options.spread || preset.spread,
            origin: { x: 0.3, y: 0.5 },
            colors: options.colors || preset.colors,
            startVelocity: 35,
            gravity: 1.2,
            ticks: 200
          });
        }
      }, 250);
      
      setTimeout(() => {
        if (confettiRef.current) {
          confettiRef.current({
            particleCount: options.particleCount || preset.particleCount,
            spread: options.spread || preset.spread,
            origin: { x: 0.7, y: 0.5 },
            colors: options.colors || preset.colors,
            startVelocity: 35,
            gravity: 1.2,
            ticks: 200
          });
        }
      }, 500);
    }
    
    // Reset after duration
    const duration = options.duration || 3000;
    setTimeout(() => {
      if (confettiRef.current) {
        confettiRef.current.reset();
      }
    }, duration);
  };
  
  return { triggerConfetti };
}