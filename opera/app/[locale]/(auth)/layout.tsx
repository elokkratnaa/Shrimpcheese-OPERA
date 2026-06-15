import React from "react";
import "@/app/globals.css";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-dark-shell text-white selection:bg-primary/30">
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        {children}
      </div>
    </div>
  );
}
