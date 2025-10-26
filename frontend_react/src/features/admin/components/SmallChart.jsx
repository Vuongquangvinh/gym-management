import React, { useEffect, useRef } from 'react';

export default function SmallChart({ data = [12, 18, 9, 24, 16, 20, 28] }) {
  const w = 180; const h = 48; const max = Math.max(...data);
  const points = data.map((v,i)=> `${(i/(data.length-1))*w},${h - (v/max)* (h-6)}`).join(' ');
  const ref = useRef(null);

  useEffect(()=>{
    const poly = ref.current;
    if(!poly) return;
    const len = poly.getTotalLength ? poly.getTotalLength() : 200;
    poly.style.strokeDasharray = len;
    poly.style.strokeDashoffset = len;
    poly.getBoundingClientRect();
    poly.style.transition = 'stroke-dashoffset 900ms ease-out';
    poly.style.strokeDashoffset = '0';
  }, [data]);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display:'block' }}>
      <polyline ref={ref} points={points} fill="none" stroke="#1976D2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
