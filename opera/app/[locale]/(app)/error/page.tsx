"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { useTranslations } from "next-intl";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

function ErrorContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("Error");
  const reason = searchParams.get("reason");

  const getErrorMessage = () => {
    switch (reason) {
      case "profiler_timeout":
        return "Something went wrong during analysis.";
      case "profiler_failed":
        return t("profiler_failed");
      default:
        return "An unexpected error occurred.";
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center gap-8 animate-in fade-in duration-700 bg-canvas p-6">
      <div className="flex flex-col items-center gap-6">
        <AlertTriangle className="size-16 text-muted" />
        <h1 className="text-xl font-bold text-ink uppercase tracking-wider">
          {t("title")}
        </h1>
        <p className="text-body text-sm max-w-xs mx-auto">
          {getErrorMessage()}
        </p>
      </div>

      <Link href="/home">
        <Button className="bg-primary hover:bg-primary-active text-white font-bold h-12 px-10 rounded-md">
          Go Home
        </Button>
      </Link>
    </div>
  );
}

export default function ErrorPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen bg-canvas text-muted">Loading...</div>}>
      <ErrorContent />
    </Suspense>
  );
}
