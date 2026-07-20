export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 28 : 30;
  const ring = size === 'sm' ? 14 : 15;
  const dot = size === 'sm' ? 3 : 4;
  const r = size === 'sm' ? 7 : 8;
  const textSize = size === 'sm' ? 'text-[17px]' : 'text-[19px]';
  return (
    <div className="flex items-center gap-[10px]">
      <div
        style={{ width: box, height: box, borderRadius: r }}
        className="bg-brand flex items-center justify-center flex-shrink-0"
      >
        <div
          style={{ width: ring, height: ring, borderRadius: '50%', border: '2.5px solid #fff' }}
          className="flex items-center justify-center"
        >
          <div style={{ width: dot, height: dot, borderRadius: '50%', background: '#fff' }} />
        </div>
      </div>
      <span className={`font-extrabold ${textSize} tracking-tight`}>RoleReady</span>
    </div>
  );
}
