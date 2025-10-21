import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

export default function ChartCard({ data = [12,19,8,24,16,20,28], title = 'Check-ins 7 ngày gần đây' }){
  const ref = useRef(null);
  
  // Tạo labels cho 7 ngày gần đây
  const getDayLabels = () => {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push(days[date.getDay()]);
    }
    return result;
  };

  const chartLabels = getDayLabels();

  useEffect(()=>{
    if(!ref.current) return;
    const canvas = ref.current;
    const chart = new Chart(canvas, {
      type: 'line',
      data: { 
        labels: chartLabels, 
        datasets: [{ 
          label: 'Check-ins', 
          data: data || [], 
          borderColor: '#3b82f6', 
          backgroundColor: 'rgba(59,130,246,0.1)', 
          tension: 0.4, 
          fill: true, 
          pointRadius: 4,
          pointBackgroundColor: '#3b82f6',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointHoverRadius: 6
        }] 
      },
      options: { 
        responsive: true, 
        maintainAspectRatio: false, 
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(0,0,0,0.8)',
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: function(context) {
                return `${context.parsed.y} check-ins`;
              }
            }
          }
        }, 
        scales: {
          y: { 
            display: true,
            grid: {
              color: 'rgba(0,0,0,0.05)',
              drawBorder: false
            },
            ticks: {
              color: '#6b7280',
              font: { size: 11 }
            }
          }, 
          x: { 
            display: true,
            grid: {
              display: false
            },
            ticks: {
              color: '#6b7280',
              font: { size: 11 }
            }
          }
        }
      }
    });
    return ()=> chart.destroy();
  }, [data, chartLabels]);

  return (
    <div style={{height:220}} className="card">
      <h4 style={{marginBottom:16}}>{title}</h4>
      <canvas ref={ref} />
    </div>
  );
}
