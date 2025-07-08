import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  ChartOptions,
} from 'chart.js';
import { Line } from 'react-chartjs-2'
import { memo } from 'react';
import { Flex } from 'antd';
import style from './style.module.scss'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const data = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
  datasets: [
    {
      label: 'Game Score',
      data: [30, 25, 35, 60, 90, 60, 70], // Example data
      borderColor: '#fff',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2,
      tension: 0.4,
      borderDash: [], // Solid line
      // pointRadius: 0,
    },
    {
      label: 'Training Score',
      data: [20, 30, 55, 30, 40, 70, 95], // Example data
      borderColor: '#AEC7ED',
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderWidth: 2,
      tension: 0.4,
      borderDash: [8, 6], // Dashed line
      // pointRadius: 0,
    },
  ],
};

const options: ChartOptions<'line'> = {
  responsive: true,
  plugins: {
    legend: {
      display: false
    },
    tooltip: {
      enabled: true,
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
      min: 0,
      max: 100,
      grid: { color: 'rgba(255,255,255,0.1)' },
      ticks: { color: 'rgba(255, 255, 255, 0.4)', font: { size: 12 }, callback: v => `${v}%` },
    },
  },
};

const LineChart = () => {
  return (
    <>
      <Flex justify='space-between' align='center' className={style.titleWrapper}>
        <div className={style.title}>Shooting Accuracy</div>
        <Flex className={style.legend}>
          <div><span className={style.pointGame}></span> Game Score</div>
          <div><span className={style.pointTraining}></span> Training Score</div>
        </Flex>
      </Flex>
      <Line data={data} options={options} />
    </>
  )
}

export default memo(LineChart)