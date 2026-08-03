// components/dashboard/DashboardSkeleton.tsx

import StatsGrid from '@/components/dashboard/StatsGrid';
import DashboardBackground from '@/components/layout/DashboardBackground';

interface DashboardSkeletonProps {
  title: string;
  translations: {
    completedLessons: string;
    completedCourses: string;
    averageWpm: string;
    averageAccuracy: string;
    streak: string;
    totalPracticeTime: string;
    days: string;
    wordsPerMinute: string;
    accuracy: string;
    consecutivePractice: string;
    thisWeek: string;
    signIn: string;
  };
}

export default function DashboardSkeleton({
  title,
  translations,
}: DashboardSkeletonProps) {
  return (
    <DashboardBackground>
      <div className="relative z-1 space-y-6 p-6">
        <div>
          <h1 className="bg-linear-to-r from-blue-400 to-purple-400 bg-clip-text text-2xl font-bold text-transparent">
            {title}
          </h1>
        </div>

        <StatsGrid status="empty" translations={translations} />
      </div>
    </DashboardBackground>
  );
}
