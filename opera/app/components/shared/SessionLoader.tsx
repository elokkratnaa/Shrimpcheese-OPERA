import React from 'react';

export default function SessionLoader() {
  return (
    <div className="min-h-screen bg-dark-shell flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-muted-soft text-sm">Memuat sesi lo...</p>
    </div>
  );
}
