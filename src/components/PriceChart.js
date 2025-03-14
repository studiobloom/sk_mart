import React, { useRef, useEffect } from 'react';
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

const PriceChart = ({ priceData, selectedInterval }) => {
  // Reference to the chart instance for cleanup
  const chartRef = useRef(null);

  // Clean up chart on unmount or re-render
  useEffect(() => {
    // Nothing to do on mount, but we need to keep track of the ref's current value
    // for our cleanup function
    let chartInstance = null;

    // Return cleanup function that uses the saved reference
    return () => {
      // Get the current chart instance from the stored variable or from current ref
      chartInstance = chartInstance || chartRef.current;
      if (chartInstance && chartInstance.destroy) {
        chartInstance.destroy();
      }
    };
  }, []);

  if (!priceData || priceData.length === 0) {
    return <div className="loading">No price data available</div>;
  }

  // Function to format a time as "12:00 AM" or "12:00 PM"
  const formatTimeLabel = (date) => {
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Generate labels for all dates, regardless of data points
  const generateDateTimeLabels = () => {
    // Group data by dates to ensure we have all dates represented
    const dateMap = new Map();
    
    // Create a map of dates to data points
    priceData.forEach(item => {
      const date = new Date(item.timestamp);
      const dateKey = date.toLocaleDateString();
      
      if (!dateMap.has(dateKey)) {
        dateMap.set(dateKey, []);
      }
      
      dateMap.get(dateKey).push(item);
    });
    
    // Now create labels with midnight markers for day changes
    return priceData.map((item, index) => {
      const date = new Date(item.timestamp);
      const dateKey = date.toLocaleDateString();
      const isMidnight = date.getHours() === 0 && date.getMinutes() === 0;
      
      // Mark midnight with "12:00 AM" to indicate new day
      if (isMidnight || (dateMap.get(dateKey)[0] === item)) {
        return formatTimeLabel(date);
      }
      
      // For other time labels, use interval-based logic
      const hour = date.getHours();
      const minutes = date.getMinutes();
      
      // Define key hours for each interval
      let showTime = false;
      
      switch (selectedInterval) {
        case '5m':
          // Show every 6 hours
          showTime = (minutes === 0 && hour % 6 === 0);
          break;
        case '15m':
          // Show every 3 hours
          showTime = (minutes === 0 && hour % 3 === 0);
          break;
        case '30m':
          // Show every 2 hours
          showTime = (minutes === 0 && hour % 2 === 0);
          break;
        case '1h':
        case '4h':
          // Show every hour on the hour
          showTime = (minutes === 0);
          break;
        default:
          showTime = (minutes === 0 && hour % 3 === 0);
      }
      
      return showTime ? formatTimeLabel(date) : '';
    });
  };
  
  const labels = generateDateTimeLabels();
  
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
        }
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
          title: function(tooltipItems) {
            const item = priceData[tooltipItems[0].dataIndex];
            const date = new Date(item.timestamp);
            return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          },
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

  // Set up a callback reference to store the chart instance
  const setChartRef = (chart) => {
    if (chart) {
      chartRef.current = chart;
    }
  };

  return (
    <div className="chart-container">
      <Line 
        ref={setChartRef} 
        data={data} 
        options={options} 
      />
    </div>
  );
};

export default PriceChart; 