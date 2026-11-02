import { useState, useEffect } from 'react';

interface Tip {
  title: string;
  body: string;
  /** CSS selector for the element to highlight. */
  target: string;
  /** Placement relative to the target. */
  placement: 'top' | 'bottom' | 'left' | 'right';
}

const TIPS: Tip[] = [
  {
    title: 'Browse the map',
    body: 'Drag to pan, scroll to zoom. Click a node to see details.',
    target: '.canvas-wrap',
    placement: 'bottom',
  },
  {
    title: 'Navigate by category',
    body: 'Open the Browse panel to jump to a domain or category.',
    target: '.nav-toggle',
    placement: 'bottom',
  },
  {
    title: 'Get recommendations',
    body: 'Select any product to see related tools and guides.',
    target: '.canvas-wrap',
    placement: 'bottom',
  },
];

const STORAGE_KEY = 'platform-atlas-onboarding-dismissed';

interface Props {
  /** Called when the user dismisses onboarding. */
  onDismiss: () => void;
}

export default function Onboarding({ onDismiss }: Props) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const tip = TIPS[step];
    if (!tip) return;

    const el = document.querySelector(tip.target);
    if (el) setTargetRect(el.getBoundingClientRect());

    const handleResize = () => {
      const updated = document.querySelector(tip.target);
      if (updated) setTargetRect(updated.getBoundingClientRect());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [step]);

  if (step >= TIPS.length) return null;

  const tip = TIPS[step];
  const isLast = step === TIPS.length - 1;

  const style: React.CSSProperties = targetRect
    ? {
        position: 'fixed',
        zIndex: 100,
        ...(tip.placement === 'bottom'
          ? { top: targetRect.bottom + 10, left: targetRect.left }
          : tip.placement === 'top'
            ? { bottom: window.innerHeight - targetRect.top + 10, left: targetRect.left }
            : tip.placement === 'left'
              ? { top: targetRect.top, right: window.innerWidth - targetRect.left + 10 }
              : { top: targetRect.top, left: targetRect.right + 10 }),
        maxWidth: '260px',
      }
    : { display: 'none' };

  return (
    <div className="onboarding">
      <div
        className="onboarding-backdrop"
        onClick={isLast ? onDismiss : undefined}
        role="presentation"
      />
      <div className="onboarding-tip" style={style}>
        <div className="onboarding-dot" aria-hidden>
          {step + 1} / {TIPS.length}
        </div>
        <h4>{tip.title}</h4>
        <p>{tip.body}</p>
        <div className="onboarding-actions">
          {!isLast && (
            <button type="button" className="onboarding-skip" onClick={onDismiss}>
              Skip
            </button>
          )}
          <button type="button" className="onboarding-next" onClick={() => setStep((s) => s + 1)}>
            {isLast ? 'Got it' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function useOnboarding() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (!dismissed) {
      // Delay one frame so the layout is painted before the tip positions itself.
      const id = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(id);
    }
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setVisible(false);
  };

  return { visible, dismiss };
}
