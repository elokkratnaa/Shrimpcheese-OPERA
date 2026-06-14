import React from 'react';

export default function SessionLoader() {
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col items-center justify-center gap-4">
      <div className="w-10 h-10 border-4 border-[#cc785c] border-t-transparent rounded-full animate-spin" />
      <p className="text-[#71717a] text-sm">Memuat sesi lo...</p>
    </div>
  );
}
