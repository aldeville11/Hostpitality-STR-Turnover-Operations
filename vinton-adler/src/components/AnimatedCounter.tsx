import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface AnimatedCounterProps {
  target: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  decimals?: number;
  className?: string;
}

export default function AnimatedCounter({
  target,
  prefix = '',
  suffix = '',
  duration = 1.5,
  decimals = 0,
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const trigger = ScrollTrigger.create({
      trigger: ref.current,
      start: 'top 85%',
      end: 'bottom 15%',
      onEnter: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration,
          ease: 'power2.out',
          snap: { val: decimals === 0 ? 1 : 0.01 },
          onUpdate: () => {
            setDisplayValue(obj.val);
          },
        });
      },
      onLeave: () => {
        setDisplayValue(0);
      },
      onEnterBack: () => {
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration,
          ease: 'power2.out',
          snap: { val: decimals === 0 ? 1 : 0.01 },
          onUpdate: () => {
            setDisplayValue(obj.val);
          },
        });
      },
    });

    return () => {
      trigger.kill();
    };
  }, [target, duration, decimals]);

  const formatted = decimals === 0
    ? Math.round(displayValue).toLocaleString()
    : displayValue.toFixed(decimals);

  return (
    <span ref={ref} className={className}>
      {prefix}{formatted}{suffix}
    </span>
  );
}
