import type { Metadata } from 'next';

import { toSupportedLocale, type Locale } from '@/lib/locales';

type PrivatePage =
  | 'dashboard'
  | 'courses'
  | 'keyboardIdentifier'
  | 'resetPassword'
  | 'ranking'
  | 'practice'
  | 'courseLessons'
  | 'friends'
  | 'friend'
  | 'lesson'
  | 'profile';

const descriptions: Record<PrivatePage, Partial<Record<Locale, string>>> = {
  dashboard: {
    'es-latam': 'Consulta tu progreso, estadísticas y recomendaciones para mejorar tu mecanografía.',
    'en-US': 'Review your progress, statistics, and recommendations to improve your typing.',
    'pt-BR': 'Acompanhe seu progresso, estatísticas e recomendações para melhorar sua digitação.',
    fr: 'Consultez vos progrès, statistiques et recommandations pour améliorer votre frappe.',
  },
  courses: {
    'es-latam': 'Explora cursos de mecanografía y continúa aprendiendo a tu propio ritmo.',
    'en-US': 'Explore typing courses and keep learning at your own pace.',
    'pt-BR': 'Explore cursos de digitação e continue aprendendo no seu ritmo.',
    fr: 'Explorez des cours de frappe et continuez à apprendre à votre rythme.',
  },
  keyboardIdentifier: {
    'es-latam': 'Identifica y configura tu distribución de teclado para practicar mecanografía con precisión.',
    'en-US': 'Identify and configure your keyboard layout to practice typing accurately.',
    'pt-BR': 'Identifique e configure seu layout de teclado para praticar digitação com precisão.',
    fr: 'Identifiez et configurez votre disposition de clavier pour vous entraîner avec précision.',
  },
  resetPassword: {
    'es-latam': 'Restablece la contraseña de tu cuenta de Kiso Desk de forma segura.',
    'en-US': 'Securely reset your Kiso Desk account password.',
    'pt-BR': 'Redefina com segurança a senha da sua conta Kiso Desk.',
    fr: 'Réinitialisez en toute sécurité le mot de passe de votre compte Kiso Desk.',
  },
  ranking: {
    'es-latam': 'Consulta tu posición y compara tus resultados de mecanografía con la comunidad.',
    'en-US': 'Check your position and compare your typing results with the community.',
    'pt-BR': 'Veja sua posição e compare seus resultados de digitação com a comunidade.',
    fr: 'Consultez votre position et comparez vos résultats de frappe avec la communauté.',
  },
  practice: {
    'es-latam': 'Practica mecanografía, mejora tu velocidad y precisión, y recibe resultados al terminar.',
    'en-US': 'Practice typing, improve your speed and accuracy, and see your results when you finish.',
    'pt-BR': 'Pratique digitação, melhore sua velocidade e precisão e veja seus resultados ao terminar.',
    fr: 'Entraînez-vous à la frappe, améliorez votre vitesse et votre précision, puis consultez vos résultats.',
  },
  courseLessons: {
    'es-latam': 'Revisa las lecciones del curso y avanza en tu práctica de mecanografía.',
    'en-US': 'Review the course lessons and progress with your typing practice.',
    'pt-BR': 'Revise as lições do curso e avance na sua prática de digitação.',
    fr: 'Consultez les leçons du cours et progressez dans votre pratique de frappe.',
  },
  friends: {
    'es-latam': 'Administra tus amistades y comparte tu progreso de mecanografía con otros usuarios.',
    'en-US': 'Manage your friends and share your typing progress with other users.',
    'pt-BR': 'Gerencie seus amigos e compartilhe seu progresso de digitação com outros usuários.',
    fr: 'Gérez vos amis et partagez vos progrès de frappe avec les autres utilisateurs.',
  },
  friend: {
    'es-latam': 'Consulta el perfil y las estadísticas de mecanografía de este usuario.',
    'en-US': 'View this user’s profile and typing statistics.',
    'pt-BR': 'Veja o perfil e as estatísticas de digitação deste usuário.',
    fr: 'Consultez le profil et les statistiques de frappe de cet utilisateur.',
  },
  lesson: {
    'es-latam': 'Completa esta lección de mecanografía y recibe resultados sobre tu velocidad y precisión.',
    'en-US': 'Complete this typing lesson and get results for your speed and accuracy.',
    'pt-BR': 'Conclua esta lição de digitação e veja resultados da sua velocidade e precisão.',
    fr: 'Terminez cette leçon de frappe et obtenez vos résultats de vitesse et de précision.',
  },
  profile: {
    'es-latam': 'Administra tu perfil, preferencias, privacidad y datos de tu cuenta de Kiso Desk.',
    'en-US': 'Manage your Kiso Desk profile, preferences, privacy, and account data.',
    'pt-BR': 'Gerencie seu perfil, preferências, privacidade e dados da sua conta Kiso Desk.',
    fr: 'Gérez votre profil Kiso Desk, vos préférences, votre confidentialité et les données de votre compte.',
  },
};

export function privatePageMetadata(lang: string, page: PrivatePage): Metadata {
  const locale = toSupportedLocale(lang);
  const description =
    descriptions[page][locale] ??
    (locale === 'pt-PT' ? descriptions[page]['pt-BR'] : undefined) ??
    descriptions[page]['es-latam'];

  return { description };
}
