// components/dashboard/ProgressChart.tsx

'use client';

import { useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';

import { TranslationKey, toSupportedLocale, useTranslations } from '@/lib/i18n';

interface ProgressChartProps {
  data: {
    labels: string[];
    values: number[];
  };
  title?: string;
  showStatusBadge?: boolean;
}

function getVisibleChartData(data: ProgressChartProps['data']) {
  return data;
}

export default function ProgressChart({
  data,
  title,
  showStatusBadge = false,
}: ProgressChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { lang } = useParams<{ lang: string }>();
  const t = useTranslations(toSupportedLocale(lang));
  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) return;

    const context = canvas.getContext('2d');

    if (!context) return;

    const styles = getComputedStyle(document.documentElement);
    const getColor = (name: string) => styles.getPropertyValue(name).trim();

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;

    context.clearRect(0, 0, width, height);

    if (!data.values.length) {
      context.fillStyle = getColor('--chart-label');
      context.font = '16px sans-serif';
      context.textAlign = 'center';
      context.fillText(
        t('components.dashboard.progressChart.general.noData' as TranslationKey),
        width / 2,
        height / 2,
      );

      return;
    }

    const { labels: visibleLabels, values: visibleValues } = getVisibleChartData(data);

    const maxValue = Math.max(...visibleValues, 100);

    const stepX = visibleValues.length > 1 ? chartWidth / (visibleValues.length - 1) : 0;

    context.beginPath();
    context.strokeStyle = getColor('--chart-grid');
    context.lineWidth = 1;

    for (let index = 0; index <= 4; index++) {
      const y = padding + (chartHeight / 4) * index;

      context.moveTo(padding, y);
      context.lineTo(width - padding, y);
      context.stroke();

      context.fillStyle = getColor('--chart-label');
      context.font = '12px sans-serif';

      const value = Math.round(maxValue - (maxValue / 4) * index);

      context.fillText(value.toString(), 10, y + 4);
    }

    if (visibleLabels.length > 0) {
      context.beginPath();
      context.strokeStyle = getColor('--chart-grid');

      for (let index = 0; index < visibleLabels.length; index++) {
        const x = padding + stepX * index;

        context.moveTo(x, padding);
        context.lineTo(x, height - padding);
        context.stroke();
      }
    }

    const points = visibleValues.map((value, index) => ({
      x: padding + stepX * index,
      y: padding + chartHeight - (value / maxValue) * chartHeight,
    }));

    if (points.length > 1) {
      const gradient = context.createLinearGradient(0, padding, 0, height - padding);

      gradient.addColorStop(0, getColor('--chart-progress-fill-start'));

      gradient.addColorStop(1, getColor('--chart-progress-fill-end'));

      context.beginPath();
      context.moveTo(points[0].x, padding + chartHeight);

      points.forEach((point) => {
        context.lineTo(point.x, point.y);
      });

      context.lineTo(points[points.length - 1].x, padding + chartHeight);

      context.closePath();
      context.fillStyle = gradient;
      context.fill();
    }

    if (points.length > 1) {
      const lineGradient = context.createLinearGradient(0, 0, width, 0);

      lineGradient.addColorStop(0, getColor('--chart-progress-line-start'));

      lineGradient.addColorStop(1, getColor('--chart-progress-line-end'));

      context.beginPath();
      context.strokeStyle = lineGradient;
      context.lineWidth = 2.5;

      points.forEach((point, index) => {
        if (index === 0) {
          context.moveTo(point.x, point.y);
        } else {
          context.lineTo(point.x, point.y);
        }
      });

      context.stroke();
    }

    points.forEach((point) => {
      context.beginPath();
      context.fillStyle = getColor('--chart-progress-point');
      context.shadowBlur = 6;
      context.shadowColor = getColor('--chart-progress-point');
      context.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      context.fill();

      context.beginPath();
      context.fillStyle = getColor('--chart-progress-point-center');
      context.shadowBlur = 0;
      context.arc(point.x, point.y, 2.5, 0, 2 * Math.PI);
      context.fill();
    });
  }, [data, t]);

  return (
    <div className="rounded-xl border border-(--border-card) bg-(--bg-card) backdrop-blur-sm light:backdrop-blur-none">
      {title && (
        <div className="flex items-center justify-between p-6 pb-4">
          <h2 className="text-lg font-semibold text-(--text-primary)">{title}</h2>

          {showStatusBadge && (
            <span className="rounded bg-(--dashboard-sign-in-badge-background) px-2 py-1 text-xs text-(--dashboard-sign-in-badge-text)">
              {t('components.dashboard.progressChart.general.noData' as TranslationKey)}
            </span>
          )}
        </div>
      )}

      <div className="rounded-b-xl bg-(--bg-card)">
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          className="h-auto w-full rounded-b-xl"
          style={{ display: 'block' }}
        />

      </div>
    </div>
  );
}
