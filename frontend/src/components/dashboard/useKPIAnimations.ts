import { useEffect, useState } from "react";

export function useKPIAnimation(value: number, duration = 800) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    let start = 0;

    if (value === 0) {
      setAnimatedValue(0);
      return;
    }

    const stepTime = Math.max(10, duration / value);

    const timer = setInterval(() => {
      start += 1;
      setAnimatedValue(start);

      if (start >= value) {
        clearInterval(timer);
        setAnimatedValue(value);
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [value, duration]);

  return animatedValue;
}