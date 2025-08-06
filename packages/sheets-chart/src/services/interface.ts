import type { IRange } from '@univerjs/core';
import type { EChartsOption, DatasetComponentOption } from 'echarts';

export interface IChartSnapshot {
    chartId?: string;
    chartName?: string;
    chartType?: ChartType;
    option?: IChartOption;
    context?: IChartContext;
    range?: IChartRange[];
}

export interface IChartOption extends EChartsOption { }

export enum ChartType {
    None = 0,
    Liner = 1,
    Bar = 2,
    Pie = 4,
    Radar = 8,
    Scatter = 16
}

export interface IChartContext {
    categoryIndex?: number;
    seriesIndexes?: number[];
    [key: string]: any;
}

export interface IChartRange extends IRange { }

export interface IChartDataset extends Pick<DatasetComponentOption, 'dimensions' | 'source' | 'type'> {
    dimensionsType?: string;
    sourceType?: string;
}
