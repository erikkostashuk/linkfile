import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.75,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
  focusable: false,
} as const;

export function ArrowUpRight(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M8 16 16 8" />
      <path d="M9 8h7v7" />
    </svg>
  );
}

export function LocationPin(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="2.75" />
    </svg>
  );
}

export function LinkfileMark(props: IconProps) {
  return (
    <svg viewBox="0 0 24 24" {...base} {...props}>
      <path d="M6.5 2.75h7L19 8.25v12A1.25 1.25 0 0 1 17.75 21.5h-11A1.25 1.25 0 0 1 5.5 20.25V4A1.25 1.25 0 0 1 6.5 2.75Z" />
      <path d="M13.25 3v5.25H18.5" />
      <path d="M10.75 15.25 13.5 12.5" />
      <path d="M9.5 13.25 8.25 14.5a1.94 1.94 0 0 0 2.75 2.75l1.25-1.25" />
      <path d="M14.75 12.75 16 11.5a1.94 1.94 0 0 0-2.75-2.75L12 10" />
    </svg>
  );
}
