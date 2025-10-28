declare module 'react-chartjs-2' {
  import { Component } from 'react';
  import { ChartType, ChartData, ChartOptions, Plugin } from 'chart.js';

  export interface ChartComponentProps<TType extends ChartType, TData = ChartData<TType>, TOptions = ChartOptions<TType>> {
    data: TData;
    options?: TOptions;
    plugins?: Plugin<TType>[];
    redraw?: boolean;
    updateMode?: 'show' | 'hide' | 'resize' | 'reset' | 'none' | 'default';
    fallbackContent?: React.ReactNode;
    datasetIdKey?: string;
  }

  export class Bar extends Component<ChartComponentProps<'bar'>> {}
  export class Line extends Component<ChartComponentProps<'line'>> {}
  export class Pie extends Component<ChartComponentProps<'pie'>> {}
  export class Doughnut extends Component<ChartComponentProps<'doughnut'>> {}
  export class Radar extends Component<ChartComponentProps<'radar'>> {}
  export class PolarArea extends Component<ChartComponentProps<'polarArea'>> {}
  export class Bubble extends Component<ChartComponentProps<'bubble'>> {}
  export class Scatter extends Component<ChartComponentProps<'scatter'>> {}
}



