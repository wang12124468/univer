import { ChartType, IChartDataset } from "@univerjs/sheets-chart";
import { IBlueprint } from "./interface";
import { calcDataset } from "./liner.blueprint";

const PieBluePrintId = `${ChartType.Pie}`;
export const PieBluePrint: IBlueprint = {
    id: PieBluePrintId,
    label: '饼图',
    order: 4,
    type: ChartType.Pie,
    icon: 'PieChartIcon',
    getInitSnapshot() {
        return {
            chartType: ChartType.Pie,
            option: {
                legend: {
                    type: 'scroll'
                },
                grid: {
                    left: 60,
                    right: 60,
                    bottom: 60,
                    top: 60
                },
                tooltip: {
                    appendTo: () => document.body
                },
                series: {
                    type: 'pie',
                },
            },
        };
    },
    test(params) {
        return `${params.snapshot.chartType}` === this.id;
    },
    getComponentId(id) {
        if (id === 'chart-setting') { return 'chart-setting.pie'; }
        return id;
    },
    toOption(params) {
        const { snapshot, dataset } = params;
        const option = snapshot.option as any;
        const sery: echarts.PieSeriesOption = option?.series?.[0] || option?.series;
        if (!sery) {
            console.error('[sheets-chart-ui] error: defaultToOption must has series');
            return option;
        }

        const newDataset = calcDataset(dataset, snapshot.context!);
        const encode = calcEncode(newDataset);
        return { ...option, series: { ...sery, encode, name: encode.value }, dataset: newDataset, legend: { ...option.legend, data: (newDataset.source as Array<any>).map(item => item[encode.itemName as any]) } };
    },
    config: { pie: true }
};

function calcEncode(dataset: IChartDataset) {
    const itemName = dataset.dimensions![0] || '';
    const value = dataset.dimensions![1] || '';
    const tooltip = value;
    return { itemName, value, tooltip }
}