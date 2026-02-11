import { useState, useEffect } from "react";

const TARGET_DATE = new Date("2026-02-28T23:59:59").getTime();

const CountdownTimer = ({ variant = "badge" }: { variant?: "badge" | "large" }) => {
  const [timeLeft, setTimeLeft] = useState(getTimeLeft());

  function getTimeLeft() {
    const now = Date.now();
    const diff = Math.max(0, TARGET_DATE - now);
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      expired: diff <= 0,
    };
  }

  useEffect(() => {
    const interval = setInterval(() => setTimeLeft(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (timeLeft.expired) {
    return (
      <span className="text-muted-foreground text-sm">
        Early adopter period ended
      </span>
    );
  }

  if (variant === "large") {
    return (
      <div className="flex items-center justify-center gap-3 sm:gap-6">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hours" },
          { value: timeLeft.minutes, label: "Minutes" },
          { value: timeLeft.seconds, label: "Seconds" },
        ].map((unit, i) => (
          <div key={unit.label} className="flex items-center gap-3 sm:gap-6">
            <div className="text-center">
              <div className="text-3xl sm:text-5xl font-display font-bold text-primary-foreground tabular-nums">
                {String(unit.value).padStart(2, "0")}
              </div>
              <div className="text-xs sm:text-sm text-primary-foreground/60 mt-1">
                {unit.label}
              </div>
            </div>
            {i < 3 && (
              <span className="text-2xl sm:text-4xl font-bold text-primary-foreground/30">:</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <span className="text-sm font-medium text-accent-foreground tabular-nums">
      {timeLeft.days}d {timeLeft.hours}h {timeLeft.minutes}m
    </span>
  );
};

export default CountdownTimer;
