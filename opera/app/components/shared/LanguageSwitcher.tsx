'use client';

import {useLocale} from 'next-intl';
import {usePathname, useRouter} from '@/i18n/routing';
import {useTransition} from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const locales = [
    {code: 'en', label: 'EN'},
    {code: 'id', label: 'ID'}
  ];

  function onLocaleChange(nextLocale: string) {
    startTransition(() => {
      router.replace(pathname, {locale: nextLocale});
    });
  }

  return (
    <div className="flex items-center gap-1 bg-surface-soft p-1 rounded-pill">
      {locales.map((l) => {
        const isActive = locale === l.code;
        return (
          <button
            key={l.code}
            disabled={isPending || isActive}
            onClick={() => onLocaleChange(l.code)}
            className={`
              px-3 py-1 text-[12px] font-medium rounded-pill transition-all duration-200
              ${isActive 
                ? 'bg-surface-card text-ink shadow-sm' 
                : 'text-muted-soft hover:text-muted cursor-pointer'}
              ${isPending ? 'opacity-50' : ''}
            `}
          >
            {l.label}
          </button>
        );
      })}
    </div>
  );
}
