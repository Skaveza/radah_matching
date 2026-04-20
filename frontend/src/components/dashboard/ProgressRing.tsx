import { useEffect, useState } from "react";

interface Props {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
}

export default function ProgressRing({
  value,
  size = 80,
  stroke = 6,
  color = "#3b82f6",
}: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(value), 100);
    return () => clearTimeout(timer);
  }, [value]);

  const radius = (size - stroke) / 2;
  const circ = radius * 2 * Math.PI;
  const offset = circ - (animated / 100) * circ;

  return (
    <svg width={size} height={size}>
      <circle
        stroke="#e5e7eb"
        fill="none"
        strokeWidth={stroke}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        stroke={color}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
        strokeDasharray={circ}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        fontSize="14"
        fontWeight="bold"
      >
        {animated}%
      </text>
    </svg>
  );
}