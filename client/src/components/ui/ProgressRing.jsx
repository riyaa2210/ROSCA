export default function ProgressRing({ value = 0, max = 1, size = 56, stroke = 5, color = "#6366f1" }) {
  const r   = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct  = Math.min(value / max, 1);
  const dash = circ * pct;

  return (
    <svg width={size} height={size} className="progress-ring">
      {/* Track */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="currentColor" strokeWidth={stroke} className="text-gray-100 dark:text-gray-800" />
      {/* Fill */}
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${dash} ${circ}`}
        className="progress-ring-circle" />
    </svg>
  );
}
