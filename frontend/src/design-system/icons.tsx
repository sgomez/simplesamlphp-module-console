const solid = { 'aria-hidden': true, viewBox: '0 0 16 16', fill: 'currentColor' } as const;
const line = { 'aria-hidden': true, fill: 'none', stroke: 'currentColor' } as const;

export function PlusIcon({ size = 14 }: { size?: 12 | 14 }) {
  return (
    <svg {...line} width={size} height={size} viewBox="0 0 14 14" strokeWidth="2">
      <path d="M7 2v10M2 7h10" />
    </svg>
  );
}

export function ChevronIcon() {
  return (
    <svg {...line} className="row-end" width="16" height="16" viewBox="0 0 16 16" strokeWidth="1.75">
      <path d="M6 3l5 5-5 5" />
    </svg>
  );
}

export function ChevronDownIcon() {
  return (
    <svg {...line} width="12" height="12" viewBox="0 0 12 12" strokeWidth="1.75">
      <path d="M2.5 4.5 6 8l3.5-3.5" />
    </svg>
  );
}

export function MenuIcon() {
  return (
    <svg {...line} width="16" height="16" viewBox="0 0 16 16" strokeWidth="1.75">
      <path d="M2 4h12M2 8h12M2 12h12" />
    </svg>
  );
}

export function LogoutIcon() {
  return (
    <svg {...line} width="16" height="16" viewBox="0 0 16 16" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2.5H3.5v11H6M10.5 5l3 3-3 3M13.5 8H6.5" />
    </svg>
  );
}

export function WarningIcon({ className }: { className?: string }) {
  return (
    <svg {...solid} className={className} width="14" height="14">
      <path d="M8 1.2 15.2 14H.8L8 1.2zm-.9 4.6v4h1.8v-4H7.1zm0 5.2v1.7h1.8V11H7.1z" />
    </svg>
  );
}

export function ErrorIcon({ className }: { className?: string }) {
  return (
    <svg {...solid} className={className} width="14" height="14">
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.9 3.5h1.8v5H7.1v-5zm0 6.2h1.8v1.8H7.1v-1.8z" />
    </svg>
  );
}

export function InfoIcon({ className }: { className?: string }) {
  return (
    <svg {...solid} className={className}>
      <path d="M8 1a7 7 0 1 0 0 14A7 7 0 0 0 8 1zm-.9 3h1.8v1.8H7.1V4zm0 3h1.8v5H7.1V7z" />
    </svg>
  );
}

export function SuccessIcon({ className }: { className?: string }) {
  return (
    <svg {...line} className={className} viewBox="0 0 16 16" strokeWidth="2">
      <path d="M3 8.5l3.2 3.2L13 4.8" />
    </svg>
  );
}

export function GripIcon() {
  return (
    <svg {...solid} width="12" height="14" viewBox="0 0 12 14">
      <circle cx="3.5" cy="3" r="1.3" />
      <circle cx="8.5" cy="3" r="1.3" />
      <circle cx="3.5" cy="7" r="1.3" />
      <circle cx="8.5" cy="7" r="1.3" />
      <circle cx="3.5" cy="11" r="1.3" />
      <circle cx="8.5" cy="11" r="1.3" />
    </svg>
  );
}

export function RemoveIcon() {
  return (
    <svg {...line} width="12" height="12" viewBox="0 0 12 12" strokeWidth="1.75">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
    </svg>
  );
}

export function CrossIcon() {
  return (
    <svg {...line} width="14" height="14" viewBox="0 0 12 12" strokeWidth="2">
      <path d="M2.5 2.5l7 7M9.5 2.5l-7 7" />
    </svg>
  );
}
