
import React, { useEffect, useRef } from 'react';
import Card from './Card';

declare global {
    interface Window {
        Chart: any;
    }
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor: any;
    borderColor: string;
    fill: boolean;
    tension: number;
  }[];
}

interface PlatformActivityChartProps {
    chartData: ChartData | null;
    isLoading: boolean;
}

const PlatformActivityChart: React.FC<PlatformActivityChartProps> = ({ chartData, isLoading }) => {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<any>(null);

  useEffect(() => {
    if (chartRef.current && chartData) {
      const ctx = chartRef.current.getContext('2d');
      if (ctx) {
        if (chartInstance.current) {
          chartInstance.current.destroy();
        }

        chartInstance.current = new window.Chart(ctx, {
          type: 'line',
          data: chartData,
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false,
                },
                tooltip: {
                    enabled: true,
                    mode: 'index',
                    intersect: false,
                    backgroundColor: '#1E293B',
                    titleColor: '#E2E8F0',
                    bodyColor: '#94A3B8',
                    borderColor: '#0052FF',
                    borderWidth: 1,
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
                    precision: 0,
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
    
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, [chartData]);
  
  const renderContent = () => {
      if (isLoading) {
          return <div className="absolute inset-0 flex items-center justify-center text-base-text-secondary"><p>Loading chart data...</p></div>;
      }
      if (!chartData || chartData.datasets[0].data.every(d => d === 0)) {
           return <div className="absolute inset-0 flex items-center justify-center text-base-text-secondary"><p>No activity in the last 7 days.</p></div>;
      }
      return <canvas ref={chartRef}></canvas>;
  }

  return (
    <Card title="Platform Activity">
      <div className="relative h-64">
        {renderContent()}
      </div>
    </Card>
  );
};

export default PlatformActivityChart;
