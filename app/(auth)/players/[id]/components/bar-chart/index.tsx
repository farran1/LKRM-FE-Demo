import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { memo } from 'react';
import { Flex } from 'antd';
import style from './style.module.scss'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// Data for each month and its performance level
const months = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];
const values = [15, 30, 20, 34, 12, 22, 18, 29, 23, 35, 13, 25];
const levels = [
  'Low', 'High', 'Moderate', 'High', 'Low', 'Moderate',
  'Moderate', 'High', 'Moderate', 'High', 'Low', 'High'
];

// Color mapping
const levelColors: Record<string, string> = {
  High: '#4bc27c',
  Moderate: '#ffe84a',
  Low: '#e44a4a',
};

// Prepare background color array for bars
const barColors = levels.map(level => levelColors[level]);

const data = {
  labels: months,
  datasets: [
    {
      label: 'Performance',
      data: values,
      backgroundColor: barColors,
      borderRadius: 8,
      barPercentage: 0.6,
      categoryPercentage: 0.6,
      borderSkipped: false,
    },
  ],
};

const options: ChartOptions<'bar'> = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      callbacks: {
        label: function(context: any) {
          const idx = context.dataIndex;
          return `${levels[idx]}: ${values[idx]}`;
        }
      },
      backgroundColor: '#222',
      titleColor: '#fff',
      bodyColor: '#fff',
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 12 } },
    },
    y: {
      beginAtZero: true,
      grid: { color: 'rgba(255,255,255,0.08)' },
      ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 12 } },
    },
  },
};

const BarChart = () => {
  return (
    <>
      <Flex justify='space-between' align='center' className={style.titleWrapper}>
        <div className={style.title}>Performance</div>
        <Flex className={style.legend}>
          <div><span className={style.pointHigh}></span> High</div>
          <div><span className={style.pointMederate}></span> Moderate</div>
          <div><span className={style.pointLow}></span> Low</div>
        </Flex>
      </Flex>
      <Bar data={data} options={options} height={100} />
    </>
  )
}

export default memo(BarChart)