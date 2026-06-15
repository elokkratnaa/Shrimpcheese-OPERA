import { useTranslations } from "next-intl";

interface OverthinkingBarProps {
  value: number;
  label: string;
}

export default function OverthinkingBar({ value, label }: OverthinkingBarProps) {
  const t = useTranslations("OverthinkingBar");

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between items-end">
        <span className="text-[10px] font-bold text-muted uppercase tracking-wider">
          {t("label")}
        </span>
        <span className="text-ink font-bold text-[11px] uppercase tracking-wider text-right">
          {label}
        </span>
      </div>
      
      <div className="w-full h-1.5 bg-hairline rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-[width] duration-400 ease"
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}
