// components/layout/DashboardBackground
'use client';

import DashboardLightBackground from './DashboardLightBackground';

export default function DashboardBackground({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate -my-6 -mx-4 min-h-[calc(100vh-4rem)] overflow-hidden bg-slate-950 light:bg-(--dashboard-light-page) sm:-mx-6 lg:-mx-8">
      <DashboardLightBackground />

      {/* Decoración de fondo */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 light:hidden">
        {/* Gradientes ambientales */}
        <div className="absolute inset-0 bg-(image:--dashboard-dark-ambient)" />

        {/* Cuadrícula sutil */}
        <div className="absolute inset-0 bg-(image:--dashboard-dark-grid) bg-[size:48px_48px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />

        {/* Luces difusas */}
        <div className="absolute -left-32 top-1/4 h-72 w-72 rounded-full bg-cyan-500/5 blur-3xl" />
        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-violet-500/5 blur-3xl" />

        {/* Viñeta para mantener el contenido legible */}
        <div className="absolute inset-0 bg-(image:--dashboard-dark-vignette)" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
