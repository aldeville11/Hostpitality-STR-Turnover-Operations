import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface ScrollRevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
  y?: number;
  duration?: number;
}

export default function ScrollReveal({
  children,
  className = '',
  delay = 0,
  stagger = 0.1,
  y = 40,
  duration = 0.8,
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const elements = containerRef.current.children;
    if (elements.length === 0) return;

    gsap.set(elements, { opacity: 0, y });

    const tl = gsap.to(elements, {
      opacity: 1,
      y: 0,
      duration,
      stagger,
      ease: 'power3.out',
      delay,
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top 85%',
        once: true,
      },
    });

    return () => {
      tl.kill();
    };
  }, [delay, stagger, y, duration]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
