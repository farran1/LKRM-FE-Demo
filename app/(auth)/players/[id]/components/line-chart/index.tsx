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

type SeriesPoint = { label: string; value: number }

export interface PlayerLineChartProps {
  pointsSeries?: SeriesPoint[]
}

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

const LineChart = ({ pointsSeries = [] }: PlayerLineChartProps) => {
  const labels = (pointsSeries.length > 0 ? pointsSeries : []).map(p => p.label)
  const values = (pointsSeries.length > 0 ? pointsSeries : []).map(p => p.value)
  const data = {
    labels: labels.length > 0 ? labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'],
    datasets: [
      {
        label: 'Game Points',
        data: values.length > 0 ? values : [30, 25, 35, 60, 90, 60, 70],
        borderColor: '#fff',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 2,
        tension: 0.4,
        borderDash: [],
      },
    ],
  }
  return (
    <>
      <Flex justify='space-between' align='center' className={style.titleWrapper}>
        <div className={style.title}>Recent Performance</div>
        <div className={style.legend}></div>
      </Flex>
      <Line data={data} options={options} />
    </>
  )
}

export default memo(LineChart)