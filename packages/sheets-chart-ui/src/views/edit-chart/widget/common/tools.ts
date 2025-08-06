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

import { ChartType, type IChartDataset, type IChartSnapshot } from '@univerjs/sheets-chart';
import { ISelectOption } from '../interface';

export class Tools {
    static calcSubType(snapshot: IChartSnapshot) {
        if(snapshot.chartType === ChartType.Liner) {
            // eslint-disable-next-line ts/no-explicit-any
            const sery = (snapshot?.option?.series as any)?.[0] || snapshot?.option?.series;
            if (!sery) { return 'normal'; }
            if (sery.smooth) { return 'smooth'; }
            if (sery.step) { return 'step'; }
            return 'normal';
        }

        if(snapshot.chartType === ChartType.Bar) {
            const yAxis: any = snapshot.option?.yAxis;
            const type = yAxis?.[0]?.type || yAxis?.type;
            const subType = type === 'category' ? 'bar' : 'column';
            return subType;
        }

        if(snapshot.chartType === ChartType.Radar) {
            const radar: any = snapshot.option?.radar;
            const shape = radar?.[0]?.shape || radar?.shape || 'polygon';
            return shape;
        }
        return '';
    }

    static calcCategories(dataset: IChartDataset): ISelectOption[] {
        return (dataset?.dimensions || []).map((label, index) => ({ value: `${index}`, label: label as string }));
    }

    static calcSeries(categories: ISelectOption[], exclude: (string | number)[], include: (string | number)[]) {
        return categories.filter((c) => include.includes(c.value) || !exclude.includes(c.value));
    }

    static getPrefixCls(...args: string[]) {
        return ['sheets-chart-ui-editor'].concat(args).filter(Boolean).join('-');
    }

    static isSameSeriesIndexes(a: (string|number)[], b: (string|number)[]) {
        if(!a && !b) { return true; }
        if(!a || !b) { return false; }
        if(a.length !== b.length) { return false; }
        return a.join('-') === b.join('-');
    }
}
