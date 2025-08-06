import { ChartType } from "@univerjs/sheets-chart";
import { IBlueprint } from "./interface";

const ScatterBluePrintId = `${ChartType.Scatter}`;
export const ScatterBluePrint: IBlueprint = {
    id: ScatterBluePrintId,
    label: '散点图',
    order: 5,
    type: ChartType.Scatter,
    icon: 'ScatterChartIcon',
    getInitSnapshot() {
        return {
            chartType: ChartType.Scatter,
            option: {
                legend: {},
                grid: {
                    left: 60,
                    right: 60,
                    bottom: 60,
                    top: 60
                },
                tooltip: {
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    },
                    appendTo: () => document.body
                },
                xAxis: {
                    axisLabel: { rotate: 60, hideOverlap: true, interval: 0 },
                    type: 'category',
                },
                yAxis: {
                    type: 'value',
                },
                series: {
                    type: 'scatter',
                },
            },
        };
    },
    test(params) {
        return `${params.snapshot.chartType}` === this.id;
    },
    getComponentId(id) {
        if (id === 'chart-setting') { return 'chart-setting.scatter'; }
        return id;
    },
    config: true
};