import { ChartType, IChartContext, IChartDataset } from "@univerjs/sheets-chart";
import { IBlueprint } from "./interface";
import { isNumeric } from "@univerjs/core";

const RadarBluePrintId = `${ChartType.Radar}`;
export const RadarBluePrint: IBlueprint = {
    id: RadarBluePrintId,
    label: '雷达图',
    order: 4,
    type: ChartType.Radar,
    icon: 'RadarChartIcon',
    getInitSnapshot() {
        return {
            chartType: ChartType.Radar,
            option: {
                title: {
                    text: ''
                },
                legend: {
                    // selectedMode: 'single',
                    type: 'scroll'
                },
                grid: {
                    left: 60,
                    right: 60,
                    bottom: 60,
                    top: 72
                },
                tooltip: {
                    appendTo: () => document.body
                },
                radar: {
                    shape: 'circle',
                    indicator: [],
                },
                series: {
                    type: 'radar'
                }
            },
        };
    },
    test(params) {
        return `${params.snapshot.chartType}` === this.id;
    },
    getComponentId(id) {
        if (id === 'chart-setting') { return 'chart-setting.radar'; }
        return id;
    },
    toOption(params) {
        const { snapshot, dataset } = params;
        const option = snapshot.option as any;
        const sery: echarts.RadarSeriesOption = option?.series?.[0] || option?.series;
        if (!sery) {
            console.error('[sheets-chart-ui] error: defaultToOption must has series');
            return option;
        }

        const { series, radar, legend } = calc(dataset, snapshot.context!);
        const newSeries = Array.isArray(series) ? series.map(s => ({ ...sery, ...s })) : { ...sery, ...series };
        return { ...option, series: newSeries, radar: { ...option.radar, ...radar }, legend: { ...option.legend, ...legend } };
    },
    config: { radar: true }
};

function calc(dataset: IChartDataset, context: IChartContext) {
    if(!dataset || !dataset.dimensions?.length) { return { radar: { indicator: [] }, series: { type: 'radar' }, legend: { data: [] } } };
    const dimensions = dataset.dimensions?.slice() || [];
    const categoryIndex = context?.categoryIndex || 0;
    const seriesIndexes = context?.seriesIndexes || Array.from({ length: dimensions.length }).map((v, index) => index).filter(i => i !== categoryIndex);
    const seriesIndexMaxMap = context?.seriesIndexMaxMap || {};
    const series = { type: 'radar', data: [] }, radar = { indicator: [] }, legend = { data: [] }, dataRef: any = {};

    radar.indicator = [categoryIndex, ...seriesIndexes].flatMap((index) => {
        const name = dimensions![index];
        dataRef[index] = name;
        if(index === categoryIndex) {
            return [];
        }
        
        const max = seriesIndexMaxMap![index];
        return [isNumeric(max) ? { name, max } : { name }]
    }) as any;
    series.data = (dataset.source as Array<{ [key: string]: any }>).map(item => {
        const legendName = item[dataRef[categoryIndex]];
        (legend.data as any).push(legendName);
        const data = seriesIndexes.map(index => item[dataRef[index]]);
        return { name: legendName, value: data };
    }) as any;
    return { series, radar, legend }
}