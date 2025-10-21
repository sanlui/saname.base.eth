
import React, { useEffect, useRef } from 'react';
import Card from './Card';

declare global {
    interface Window {
        Chart: any;
    }
}

const PlatformActivityChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        // Destroy previous chart instance if it exists
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(0, 82, 255, 0.5)');
        gradient.addColorStop(1, 'rgba(0, 82, 255, 0)');

        chartInstance.current = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
            datasets: [{
              label: 'Tokens Created',
              data: [12, 19, 25, 35, 42, 33, 50],
              borderColor: '#0052FF',
              backgroundColor: gradient,
              borderWidth: 2,
              pointBackgroundColor: '#FFFFFF',
              pointBorderColor: '#0052FF',
              pointHoverBackgroundColor: '#0052FF',
              pointHoverBorderColor: '#FFFFFF',
              tension: 0.4,
              fill: true,
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: 'rgba(148, 163, 184, 0.2)',
                },
                ticks: {
                    color: '#94A3B8',
                }
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                    color: '#94A3B8',
                }
              }
            }
          }
        });
      }
    }
    
    // Cleanup function to destroy chart on component unmount
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, []);

  return (
    <Card title="Platform Activity">
      <div className="relative h-64">
        <canvas ref={chartRef}></canvas>
      </div>
    </Card>
  );
};

export default PlatformActivityChart;
