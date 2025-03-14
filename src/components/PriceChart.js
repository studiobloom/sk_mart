import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PriceChart = ({ priceData }) => {
  if (!priceData || priceData.length === 0) {
    return <div className="loading">No price data available</div>;
  }

  // Format the data for the chart
  const labels = priceData.map((item, index) => {
    const date = new Date(item.timestamp);
    const prevDate = index > 0 ? new Date(priceData[index - 1].timestamp) : null;
    
    // If it's the first item or the date has changed from the previous item
    if (!prevDate || date.toLocaleDateString() !== prevDate.toLocaleDateString()) {
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If it's the same day, only show time
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  });

  // These values are not currently used in chart but may be useful for future enhancements
  // const avgPrices = priceData.map(item => item.avg);
  // const minPrices = priceData.map(item => item.min);
  // const maxPrices = priceData.map(item => item.max);
  // const volumes = priceData.map(item => item.volume);

  // This is not currently used but may be needed for future volume display features
  // const maxVolume = Math.max(...volumes);
  // Scale volumes to fit in the chart (25% of chart height) - not currently used
  // const scaledVolumes = volumes.map(vol => (vol / maxVolume) * (Math.max(...avgPrices) * 0.25));

  const data = {
    labels,
    datasets: [
      {
        label: 'Average Price',
        data: priceData.map(item => item.avg),
        borderColor: '#e6c05c',
        backgroundColor: 'rgba(230, 192, 92, 0.1)',
        fill: true,
        tension: 0.1,
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          color: '#8a8a8a',
          font: {
            family: 'SaintKDG',
            size: 11
          }
        },
        grid: {
          color: 'rgba(42, 42, 42, 0.5)',
          drawBorder: false,
        },
      },
      y: {
        title: {
          display: true,
          text: 'Price',
          color: '#8a8a8a',
          font: {
            family: 'SaintKDG',
            size: 12
          }
        },
        ticks: {
          color: '#8a8a8a',
          font: {
            family: 'SaintKDG',
            size: 11
          }
        },
        grid: {
          color: 'rgba(42, 42, 42, 0.5)',
          drawBorder: false,
        },
      },
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: '#1a1a1a',
        borderColor: '#2a2a2a',
        borderWidth: 1,
        titleColor: '#e6c05c',
        titleFont: {
          family: 'SaintKDG',
          size: 13
        },
        bodyFont: {
          family: 'SaintKDG',
          size: 12
        },
        bodyColor: '#c7c7c7',
        callbacks: {
          label: function(context) {
            const data = priceData[context.dataIndex];
            return [
              `Average: ${data.avg}`,
              `Min: ${data.min}`,
              `Max: ${data.max}`,
              `Volume: ${data.volume}`
            ];
          }
        }
      }
    },
  };

  return (
    <div className="chart-container">
      <Line data={data} options={options} />
    </div>
  );
};

export default PriceChart; 