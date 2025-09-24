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

import type { IChartDataset, IChartSnapshot } from '@univerjs/sheets-chart';
import type { ISettingConfig } from '../../interface';
import { useDependency } from '@univerjs/ui';
import { useCallback, useMemo, useState } from 'react';
import { SheetsChartUIService } from '../../../../../services/sheets-chart-ui.service';
import { Tools } from '../../common/tools';

export function useSettingHook<T extends ISettingConfig>(unitId: string, subUnitId: string, snapshot: IChartSnapshot, dataset: IChartDataset) {
    const chartUIService = useDependency(SheetsChartUIService);
    const [temp, setTemp] = useState({} as T);

    const categories = useMemo(() => Tools.calcCategories(dataset!), [dataset]);

    const getDefaultSeriesIndexes = useCallback((dataset: IChartDataset, categoryIndex: number) => {
        const index = dataset.dimensions?.findIndex((v, i) => +i !== +categoryIndex);
        return index === -1 ? [] : [index] as number[];
    }, []);

    const settings: T = useMemo(() => {
        const subType = Tools.calcSubType(snapshot!);
        const refString = chartUIService.serializeRangeWithSheet({ unitId, sheetName: subUnitId, range: snapshot.range! });
        const categoryIndex = snapshot.context?.categoryIndex || 0;
        const seriesIndexes = snapshot.context?.seriesIndexes || getDefaultSeriesIndexes(dataset, categoryIndex);
        return Object.assign({}, { subType, refString, categoryIndex, seriesIndexes }, temp);
    }, [snapshot, dataset, temp]);

    const getNextSery = useCallback(() => {
        if (!settings.seriesIndexes || !dataset.dimensions) { return null; }
        if (settings.seriesIndexes.length === dataset.dimensions.length - 1) { return null; }
        const all = [...settings.seriesIndexes, settings.categoryIndex].map((i) => `${i}`);
        const index = dataset.dimensions.findIndex((d, index) => !all.includes(`${index}`));
        if (index !== -1) { return index; }

        return null;
    }, [settings, dataset]);

    const isFullSeries = useMemo(() => getNextSery() === null, [getNextSery]);

    return { settings, categories, temp, setTemp, isFullSeries, getNextSery, getDefaultSeriesIndexes };
}
