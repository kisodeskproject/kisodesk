'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'kisodesk-courses-guidance-open:v1';

type CourseGuidanceContent = {
  typingVsSpelling: string;
  beginners: string;
  language: string;
  typingVsSpellingAnswer: string;
  beginnersAnswer: string;
  languageAnswer: string;
};

export default function CourseGuidance({
  content,
  showLabel,
  hideLabel,
}: {
  content: CourseGuidanceContent;
  showLabel: string;
  hideLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(window.localStorage.getItem(STORAGE_KEY) !== 'false');
  }, []);

  const toggle = () => {
    setIsOpen((current) => {
      const next = !current;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  };

  return (
    <section className="mt-8 rounded-xl border border-(--border-card) bg-(--bg-card) p-5">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={isOpen}
          aria-controls="course-guidance"
          className="text-sm font-semibold text-(--accent-blue) underline underline-offset-4 hover:text-(--text-primary)"
        >
          {isOpen ? hideLabel : showLabel}
        </button>
      </div>

      {isOpen ? (
        <div id="course-guidance" className="mt-4 grid gap-5 md:grid-cols-3 md:divide-x md:divide-(--border-card)">
          {[
            [content.typingVsSpelling, content.typingVsSpellingAnswer],
            [content.beginners, content.beginnersAnswer],
            [content.language, content.languageAnswer],
          ].map(([question, answer], index) => (
            <section key={question} className={index === 0 ? '' : 'md:ps-5'}>
              <h2 className="text-lg font-semibold">{question}</h2>
              <p className="mt-2 text-(--text-secondary)">{answer}</p>
            </section>
          ))}
        </div>
      ) : null}
    </section>
  );
}
