import React from "react";

/**
 * Signature element: progress rendered as a row of pitched-roof peaks.
 * Completed steps are filled copper, the current step is ink, remaining
 * steps are a thin outline. Ties the chrome of the wizard back to the
 * subject (roof pitch) instead of a generic progress bar.
 */
export default function RooflineProgress({ total, current }) {
  const width = 520;
  const height = 40;
  const baseline = 34;
  const peakY = 8;
  const gap = width / total;

  const points = Array.from({ length: total }, (_, i) => {
    const cx = gap * i + gap / 2;
    return { cx, index: i };
  });

  return (
    <div className="roofline-progress" role="progressbar" aria-valuenow={current + 1} aria-valuemin={1} aria-valuemax={total}>
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <line x1="0" y1={baseline} x2={width} y2={baseline} stroke="var(--line)" strokeWidth="1.5" />
        {points.map(({ cx, index }, i) => {
          const state = index < current ? "done" : index === current ? "active" : "pending";
          const left = cx - gap / 2 + 6;
          const right = cx + gap / 2 - 6;
          const stroke = state === "pending" ? "var(--line)" : state === "active" ? "var(--ink)" : "var(--copper)";
          const fill = state === "done" ? "var(--copper)" : "none";
          return (
            <g key={i}>
              <path
                d={`M ${left} ${baseline} L ${cx} ${peakY} L ${right} ${baseline}`}
                fill={fill}
                fillOpacity={state === "done" ? 0.18 : 0}
                stroke={stroke}
                strokeWidth={state === "active" ? 2.5 : 1.5}
                strokeLinejoin="round"
              />
              <circle cx={cx} cy={peakY} r={state === "active" ? 4 : 3} fill={state === "pending" ? "var(--paper-raised)" : stroke} stroke={stroke} strokeWidth="1.5" />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
