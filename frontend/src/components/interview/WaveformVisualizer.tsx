import React, { useEffect, useRef } from 'react';

interface WaveformVisualizerProps {
  audioLevel: number; // 0 to 1
  isRecording: boolean;
  className?: string;
}

export function WaveformVisualizer({ audioLevel, isRecording, className = '' }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const historyRef = useRef<number[]>(Array(50).fill(0));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);
    
    const width = rect.width;
    const height = rect.height;

    const draw = () => {
      if (!isRecording && historyRef.current.every(v => v < 0.01)) {
        // Clear when stopped and flat
        ctx.clearRect(0, 0, width, height);
        // Draw resting line
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.strokeStyle = 'rgba(var(--brand-primary-rgb, 99, 102, 241), 0.3)';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      // Update history with easing for smooth decay
      const history = historyRef.current;
      history.push(audioLevel);
      history.shift();

      ctx.clearRect(0, 0, width, height);

      // Draw bars
      const barWidth = 3;
      const gap = 2;
      const barCount = Math.floor(width / (barWidth + gap));
      
      // Use only the most recent partial history that fits
      const displayHistory = history.slice(-barCount);
      
      displayHistory.forEach((level, i) => {
        const x = i * (barWidth + gap);
        // Minimum height of 2px, max 90% of container height
        const barHeight = Math.max(2, level * (height * 0.9));
        const y = (height - barHeight) / 2;

        // Gradient based on level
        const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
        gradient.addColorStop(0, `rgba(99, 102, 241, ${0.4 + level * 0.6})`); // brand-primary
        gradient.addColorStop(1, `rgba(168, 85, 247, ${0.4 + level * 0.6})`); // brand-secondary

        ctx.fillStyle = gradient;
        
        // Draw rounded rect
        ctx.beginPath();
        ctx.roundRect(x, y, barWidth, barHeight, 2);
        ctx.fill();
      });

      if (isRecording) {
        animationRef.current = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [audioLevel, isRecording]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ minHeight: '40px' }}
      />
    </div>
  );
}
