import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ChartCard({ labels = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], data = [12,19,8,24,16,20,28], title = 'Active This Week' }){
  const ref = useRef(null);
  useEffect(()=>{
    if(!ref.current) return;
    const canvas = ref.current;
    const chart = new Chart(canvas, {
      type: 'line',
      data: { labels, datasets: [{ label: title, data: data || [], borderColor: '#1976D2', backgroundColor: 'rgba(25,118,210,0.08)', tension:0.35, fill:true, pointRadius:3 }] },
      options: { responsive:true, maintainAspectRatio:false, plugins:{legend:{display:false}}, scales:{y:{display:false}, x:{display:false}} }
    });
    return ()=> chart.destroy();
  }, [labels, data, title]);

  return (
    <div style={{height:160}} className="card">
      <h4 style={{marginBottom:8}}>{title}</h4>
      <canvas ref={ref} />
    </div>
  );
}
