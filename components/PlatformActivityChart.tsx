
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
                    backgroundColor: '#161B22',
                    titleColor: '#E6EDF3',
                    bodyColor: '#7D8590',
                    borderColor: '#30363D',
                    borderWidth: 1,
                    padding: 10,
                    cornerRadius: 8,
                    bodyFont: { family: 'Inter' },
                    titleFont: { family: 'Inter', weight: 'bold' }
                }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: '#30363D',
                },
                ticks: {
                    color: '#7D8590',
                    precision: 0,
                    font: { family: 'Inter' }
                }
              },
              x: {
                grid: {
                  display: false,
                },
                ticks: {
                    color: '#7D8590',
                    font: { family: 'Inter' }
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
          return <div className="absolute inset-0 flex items-center justify-center text-text-secondary"><p>Loading chart data...</p></div>;
      }
      if (!chartData || chartData.datasets[0].data.every(d => d === 0)) {
           return <div className="absolute inset-0 flex items-center justify-center text-text-secondary"><p>No activity in the last 7 days.</p></div>;
      }
      return <canvas ref={chartRef}></canvas>;
  }

  return (
    <Card title="Platform Activity (7 Days)">
      <div className="relative h-64 md:h-full">
        {renderContent()}
      </div>
    </Card>
  );
};

export default PlatformActivityChart;