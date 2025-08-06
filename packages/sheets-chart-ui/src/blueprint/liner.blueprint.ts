/**
 * Copyright 2023-present DreamNum Co., Ltd.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type { IChartContext, IChartDataset, IChartOption } from '@univerjs/sheets-chart';
import type { IBlueprint, IBlueprintParams } from './interface';
import { ChartType } from '@univerjs/sheets-chart';

const LinerBluePrintId = `${ChartType.Liner}`;

export const LinerBluePrint: IBlueprint = {
    id: LinerBluePrintId,
    label: '折线图',
    order: 1,
    type: ChartType.Liner,
    icon: 'LineChartIcon',
    getInitSnapshot() {
        return {
            chartType: ChartType.Liner,
            option: {
                title: {
                    text: ''
                },
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
                    trigger: 'axis',
                    axisPointer: {
                        type: 'cross'
                    },
                    appendTo: () => document.body
                },
                xAxis: {
                    axisLabel: { rotate: 60, hideOverlap: true, interval: 0 },
                    type: 'category'
                },
                yAxis: {
                    type: 'value',
                },
                series: {
                    type: 'line',
                },
            },
        };
    },
    test(params) {
        return `${params.snapshot.chartType}` === LinerBluePrintId;
    },
    getComponentId(id) {
        if (id === 'chart-setting') { return 'chart-setting.liner'; }
        return id;
    },
    config: true
};

export function defaultToOption(params: IBlueprintParams): IChartOption {
    const { snapshot, dataset } = params;
    // eslint-disable-next-line ts/no-explicit-any
    const option = snapshot.option as any;
    const sery = option?.series?.[0] || option?.series;
    if (!sery) {
        console.error('[sheets-chart-ui] error: defaultToOption must has series');
        return option;
    }

    const newDataset = calcDataset(dataset, snapshot.context!);
    const newSeries = newDataset.dimensions?.flatMap((d, index) => index === 0 ? [] : [{ ...sery, name: d }]) || [sery];
    return { ...option, series: newSeries, dataset: newDataset, legend: { ...option.legend, data: newDataset.dimensions?.slice(1) } };
}

export function calcDataset(dataset: IChartDataset, context: IChartContext): IChartDataset {
    if (!dataset) { return { dimensions: [], source: [] }; }
    const dimensions = dataset.dimensions?.slice() || [];
    const source = (dataset.source as Array<any>)?.slice() || [];
    if (!context || !dimensions.length) { return { ...dataset, dimensions, source }; }

    const categoryIndex = context.categoryIndex || 0;
    const seriesIndexes = context.seriesIndexes || Array.from({ length: dimensions.length }).map((v, index) => index).filter(i => `${i}` !== `${categoryIndex}`);
    const newDimensions = [categoryIndex, ...seriesIndexes].map((index) => dimensions![index]).filter(Boolean);
    return { ...dataset, dimensions: newDimensions, source };
}
