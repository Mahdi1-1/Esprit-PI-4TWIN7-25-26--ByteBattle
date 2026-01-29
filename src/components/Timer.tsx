import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface TimerProps {
  endTime: Date;
  onExpire?: () => void;
  variant?: 'default' | 'warning' | 'danger';
}

export function Timer({ endTime, onExpire, variant = 'default' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = endTime.getTime();
      const diff = Math.max(0, end - now);
      
      if (diff === 0 && onExpire) {
        onExpire();
      }
      
      return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 100);

    return () => clearInterval(interval);
  }, [endTime, onExpire]);

  const hours = Math.floor(timeLeft / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);
  const milliseconds = Math.floor((timeLeft % 1000) / 10);

  const variantStyles = {
    default: 'bg-[var(--surface-1)] text-[var(--text-primary)] border-[var(--border-default)]',
    warning: 'bg-[var(--state-warning)]/10 text-[var(--state-warning)] border-[var(--state-warning)]/20',
    danger: 'bg-[var(--state-error)]/10 text-[var(--state-error)] border-[var(--state-error)]/20 animate-pulse',
  };

  const currentVariant = 
    timeLeft < 60000 ? 'danger' : 
    timeLeft < 300000 ? 'warning' : 
    variant;

  return (
    <div
      className={`
        inline-flex items-center gap-2
        px-4 py-2
        border
        rounded-[var(--radius-md)]
        font-code
        transition-all duration-200
        ${variantStyles[currentVariant]}
      `}
    >
      <Clock className="w-4 h-4" />
      <span className="font-semibold tabular-nums">
        {hours > 0 && `${hours.toString().padStart(2, '0')}:`}
        {minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
        <span className="text-[0.75rem] opacity-75">
          .{milliseconds.toString().padStart(2, '0')}
        </span>
      </span>
    </div>
  );
}

export function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const target = targetDate.getTime();
      return Math.max(0, target - now);
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="flex items-center gap-3">
      {days > 0 && (
        <div className="flex flex-col items-center">
          <div className="text-h2 font-semibold text-[var(--brand-primary)] font-code">
            {days.toString().padStart(2, '0')}
          </div>
          <div className="text-caption text-[var(--text-muted)]">Days</div>
        </div>
      )}
      <div className="flex flex-col items-center">
        <div className="text-h2 font-semibold text-[var(--brand-primary)] font-code">
          {hours.toString().padStart(2, '0')}
        </div>
        <div className="text-caption text-[var(--text-muted)]">Hours</div>
      </div>
      <span className="text-h2 text-[var(--text-muted)]">:</span>
      <div className="flex flex-col items-center">
        <div className="text-h2 font-semibold text-[var(--brand-primary)] font-code">
          {minutes.toString().padStart(2, '0')}
        </div>
        <div className="text-caption text-[var(--text-muted)]">Minutes</div>
      </div>
      <span className="text-h2 text-[var(--text-muted)]">:</span>
      <div className="flex flex-col items-center">
        <div className="text-h2 font-semibold text-[var(--brand-primary)] font-code">
          {seconds.toString().padStart(2, '0')}
        </div>
        <div className="text-caption text-[var(--text-muted)]">Seconds</div>
      </div>
    </div>
  );
}
