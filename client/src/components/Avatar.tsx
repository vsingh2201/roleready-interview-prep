function initialsOf(name: string | null): string {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  if (parts.length === 0) return '';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function Avatar({ name }: { name: string | null }) {
  return (
    <div
      className="w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[13px] text-brand"
      style={{ background: '#ddd6f5', border: '2px solid #fff', boxShadow: '0 0 0 1px #e2e2ea' }}
    >
      {initialsOf(name)}
    </div>
  );
}
