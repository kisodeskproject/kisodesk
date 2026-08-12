// components/ranking/DistributionCharts.tsx
'use client';

import { useEffect, useRef } from 'react';

interface UserStatsPoint {
  wpm: number;
  accuracy: number;
}

interface DistributionChartsProps {
  wpmValues?: number[];
  currentUserWpm?: number;
  userData?: UserStatsPoint[];
  currentUser?: UserStatsPoint;
  t: (key: string, values?: Record<string, string | number>) => string;
}

export default function DistributionCharts({
  userData = [],
  currentUser,
  t,
}: DistributionChartsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const styles = getComputedStyle(document.documentElement);
    const color = (name: string) => styles.getPropertyValue(name).trim();

    const w = canvas.width;
    const h = canvas.height;
    const padding = 60;
    const minWpm = 0;
    const maxWpm = 160;
    const minAcc = 80;
    const maxAcc = 100;

    const getX = (wpm: number) => {
      const clamped = Math.min(Math.max(wpm, minWpm), maxWpm);
      return padding + ((clamped - minWpm) / (maxWpm - minWpm)) * (w - padding * 2);
    };
    const getY = (acc: number) => {
      const clamped = Math.min(Math.max(acc, minAcc), maxAcc);
      const ratio = (clamped - minAcc) / (maxAcc - minAcc);
      return h - padding - ratio * (h - padding * 2);
    };

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = color('--chart-background');
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = color('--chart-grid');
    ctx.lineWidth = 1;
    ctx.beginPath();
    [80, 85, 90, 95, 100].forEach((accVal) => {
      const y = getY(accVal);
      ctx.moveTo(padding, y);
      ctx.lineTo(w - padding, y);
      ctx.fillStyle = color('--chart-axis');
      ctx.font = '10px sans-serif';
      ctx.fillText(`${accVal}%`, padding - 35, y + 4);
    });
    [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110, 120, 130, 140, 150, 160].forEach((wpmVal) => {
      const x = getX(wpmVal);
      ctx.moveTo(x, padding);
      ctx.lineTo(x, h - padding);
      ctx.fillStyle = color('--chart-axis');
      ctx.fillText(`${wpmVal}`, x - 8, h - padding + 15);
    });
    ctx.stroke();

    ctx.globalAlpha = 0.6;
    userData.forEach((point) => {
      const x = getX(point.wpm);
      const y = getY(point.accuracy);
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color('--chart-point');
      ctx.fill();
    });

    if (currentUser) {
      ctx.globalAlpha = 1;
      const ux = getX(currentUser.wpm);
      const uy = getY(currentUser.accuracy);
      ctx.shadowBlur = 12;
      ctx.shadowColor = color('--chart-current');
      ctx.beginPath();
      ctx.arc(ux, uy, 8, 0, Math.PI * 2);
      ctx.fillStyle = color('--chart-current');
      ctx.fill();
      ctx.strokeStyle = color('--chart-current-outline');
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.shadowBlur = 0;
      ctx.fillStyle = color('--chart-current');
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(t('ranking.general.currentUser'), ux - 10, uy - 10);
    }

    ctx.fillStyle = color('--chart-label');
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(t('ranking.general.speedAxis'), w / 2, h - 8);
    ctx.save();
    ctx.translate(15, h / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(t('ranking.general.accuracyAxis'), 0, 0);
    ctx.restore();
  }, [userData, currentUser, t]);

  return (
    <div className="bg-(--bg-card) backdrop-blur-sm rounded-xl border border-(--border-card) p-4">
      <canvas ref={canvasRef} width={800} height={400} className="w-full h-auto" />
    </div>
  );
}
