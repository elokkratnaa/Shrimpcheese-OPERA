import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  fullName?: string;
  email?: string;
  className?: string;
  fallbackClassName?: string;
  onClick?: () => void;
}

export function UserAvatar({ fullName, email, className, fallbackClassName, onClick }: UserAvatarProps) {
  const initials = fullName
    ? fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : email?.slice(0, 2).toUpperCase() || "OP";

  return (
    <Avatar className={cn("size-8", className)} onClick={onClick}>
      <AvatarFallback className={cn("font-semibold bg-surface-card text-ink", fallbackClassName)}>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}
