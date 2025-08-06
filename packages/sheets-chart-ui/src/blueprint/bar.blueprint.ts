import { ChartType } from "@univerjs/sheets-chart";
import { IBlueprint } from "./interface";

const BarBluePrintId = `${ChartType.Bar}`;
export const BarBluePrint: IBlueprint = {
    id: BarBluePrintId,
    label: '柱状图',
    order: 2,
    type: ChartType.Bar,
    icon: 'ColumnChartIcon',
    getInitSnapshot() {
        return {
            chartType: ChartType.Bar,
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
                    type: 'bar',
                },
            },
        };
    },
    test(params) {
        return `${params.snapshot.chartType}` === this.id;
    },
    getComponentId(id) {
        if (id === 'chart-setting') { return 'chart-setting.bar'; }
        return id;
    },
    config: true
};