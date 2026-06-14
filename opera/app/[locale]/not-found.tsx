import React from 'react'
import { Link } from '@/i18n/routing'
import OperaNav from '@/app/components/shared/OperaNav'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

export default function NotFound() {
  const t = useTranslations("Error.notFound")

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col font-sans">
      <OperaNav variant="guest" />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <div className="w-full max-w-[480px] text-center">
          <span className="text-xs font-medium tracking-[1.5px] uppercase text-[#6c6a64] mb-4 block">
            {t("title")}
          </span>
          <h1 className="text-[28px] font-serif font-normal text-[#141413] mb-6 leading-tight">
            {t("message")}
          </h1>
          <p className="text-sm text-[#8e8b82] mb-12">
            {t("sub")}
          </p>
          <div className="flex justify-center">
            <Link href="/home">
              <Button
                className="bg-[#cc785c] hover:bg-[#a9583e] text-white rounded-md h-12 px-8 font-medium cursor-pointer"
              >
                {t("cta")}
              </Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}
