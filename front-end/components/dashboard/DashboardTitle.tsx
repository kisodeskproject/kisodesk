// components/dashboard/DashboardTitle.tsx

interface DashboardTitleProps {
  title: string;
}

export default function DashboardTitle({ title }: DashboardTitleProps) {
  return (
    <div>
      <h1 className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent light:from-(--page-title-primary-color) light:to-(--page-title-secondary-color)">
        {title}
      </h1>
    </div>
  );
}
