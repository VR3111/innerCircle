import { useEffect, useState } from 'react';

export function useIsDesktop(breakpoint = 1024): boolean {
  const [wide, setWide] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= breakpoint : true
  );
  useEffect(() => {
    const on = () => setWide(window.innerWidth >= breakpoint);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, [breakpoint]);
  return wide;
}
