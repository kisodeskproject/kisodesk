// components/layout/DashboardLightBackground
'use client';

export default function DashboardLightBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 hidden overflow-hidden light:block"
    >
      {/* Base cálida tipo papel */}
      <div className="absolute inset-0 bg-(--dashboard-light-base)" />

      {/* Iluminación central suave */}
      <div className="absolute inset-0 bg-(image:--dashboard-light-glow)" />

      {/* Cuadrícula tenue */}
      <div className="absolute inset-0 bg-(image:--dashboard-light-grid-near) bg-[size:48px_48px]" />

      {/* Segunda cuadrícula más amplia */}
      <div className="absolute inset-0 bg-(image:--dashboard-light-grid-far) bg-[size:192px_192px]" />

      {/* Oscurecimiento mate hacia los bordes */}
      <div className="absolute inset-0 bg-(image:--dashboard-light-vignette)" />

      {/* Tinte uniforme hueso */}
      <div className="absolute inset-0 bg-(--dashboard-light-tint)" />
    </div>
  );
}
