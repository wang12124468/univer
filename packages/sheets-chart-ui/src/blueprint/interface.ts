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

import type { ChartType, IChartDataset, IChartOption, IChartSnapshot } from '@univerjs/sheets-chart';

export interface IBlueprintParams {
    snapshot: IChartSnapshot;
    dataset: IChartDataset;
}

export interface IBlueprint {
    id: string;
    label?: string;
    order?: number;
    type?: ChartType;
    icon?: string;
    test?: (params: IBlueprintParams) => boolean;
    getInitSnapshot?: () => IChartSnapshot;
    toOption?: (params: IBlueprintParams) => IChartOption;
    getComponentId?: (id: string) => string;
    config?: boolean | { grid?: boolean; xAxis?: boolean; yAxis?: boolean, radar?: boolean; pie?: boolean };
}
