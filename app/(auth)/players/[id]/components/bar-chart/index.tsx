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

type PerfPoint = { label: string; value: number; level: 'High' | 'Moderate' | 'Low' }
export interface PlayerBarChartProps {
  performance?: PerfPoint[]
}

// Fallback data
const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
const values = [15,30,20,34,12,22,18,29,23,35,13,25]
const levels: string[] = ['Low','High','Moderate','High','Low','Moderate','Moderate','High','Moderate','High','Low','High']

// Color mapping
const levelColors: Record<string, string> = {
  High: '#4bc27c',
  Moderate: '#ffe84a',
  Low: '#e44a4a',
};

const makeData = (perf: PerfPoint[] | undefined) => {
  const labels = (perf && perf.length ? perf.map(p => p.label) : months)
  const dataVals = (perf && perf.length ? perf.map(p => p.value) : values)
  const barColors = (perf && perf.length ? perf.map(p => levelColors[p.level]) : (levels as any[]).map(l => levelColors[l]))
  return {
    labels,
    datasets: [
      {
        label: 'Performance',
        data: dataVals,
        backgroundColor: barColors,
        borderRadius: 8,
        barPercentage: 0.6,
        categoryPercentage: 0.6,
        borderSkipped: false,
      },
    ],
  }
}

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

const BarChart = ({ performance }: PlayerBarChartProps) => {
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
      <Bar data={makeData(performance)} options={options} height={100} />
    </>
  )
}

export default memo(BarChart)