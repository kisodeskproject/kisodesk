interface AdaptivePracticeKeysProps {
  keys: string[];
  label: string;
}

export default function AdaptivePracticeKeys({ keys, label }: AdaptivePracticeKeysProps) {
  if (keys.length === 0) return null;

  return (
    <section
      className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:max-w-[50%]"
      aria-labelledby="adaptive-practice-keys-title"
    >
      <h2 id="adaptive-practice-keys-title" className="text-sm font-semibold text-(--text-primary)">
        {label}:
      </h2>
      <div className="max-w-full overflow-x-auto" aria-label={label}>
        <ol className="flex w-max items-center gap-1.5 px-1" aria-label={`${label}: ${keys.join(', ')}`}>
          {keys.map((key, index) => (
            <li key={`${key}-${index}`}>
              <span
                data-practice-key={key}
                data-practice-key-state="default"
                className="inline-flex h-8 min-w-8 items-center justify-center rounded-md border border-(--border-card) bg-(--bg-secondary) px-2 font-mono text-xs font-semibold text-white"
              >
                {key}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
