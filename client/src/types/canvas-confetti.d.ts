declare module 'canvas-confetti' {
  export interface CreateTypes {
    (options?: ConfettiOptions): void;
    reset: () => void;
  }

  export interface ConfettiOptions {
    particleCount?: number;
    angle?: number;
    spread?: number;
    startVelocity?: number;
    decay?: number;
    gravity?: number;
    drift?: number;
    ticks?: number;
    origin?: {
      x: number;
      y: number;
    };
    colors?: string[];
    shapes?: ('square' | 'circle')[];
    scalar?: number;
    zIndex?: number;
    disableForReducedMotion?: boolean;
  }

  export default function confetti(options?: ConfettiOptions): void;
  export default function confetti(canvas: HTMLCanvasElement, options?: { resize?: boolean, useWorker?: boolean }): CreateTypes;
}