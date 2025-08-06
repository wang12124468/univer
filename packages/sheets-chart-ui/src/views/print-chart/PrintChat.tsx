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

import { useDependency, useObservable } from '@univerjs/ui';
import { useEffect, useMemo, useRef } from 'react';
import { SheetsChartUIService } from '../../services/sheets-chart-ui.service';
import { getPrefixCls } from '../util';
import './style/index.less';
import { ChartRenderModel } from '../../services/chart-render';

const prefixCls = getPrefixCls('print-chart');

export function PrintChart(props: { data: { chartId: string, unitId: string, subUnitId: string } }) {
    const { chartId, unitId, subUnitId } = props.data;

    const elementRef = useRef<HTMLDivElement>(null);

    const sheetsChartUIService = useDependency(SheetsChartUIService);

    const model = useMemo(() => sheetsChartUIService.getChartRenderModel(unitId, subUnitId, chartId), [chartId, unitId, subUnitId]);

    if (!model) { return null; }
    const snapshot = useObservable(model.snapshot.value$);
    if (!snapshot) { return null; }
    const activeChart = useObservable(sheetsChartUIService.activeChart$);
    const isActive = useMemo(() => activeChart?.chartId === model.chartId && activeChart.unitId === model.unitId && activeChart.subUnitId === model.subUnitId, [activeChart, model]);

    return (
        <div className={`${prefixCls} ${isActive ? 'active' : ''}`} ref={elementRef}>
            <div
                className={`
                  ${prefixCls}-header
                `}
            >
                <div
                    className={`
                      ${prefixCls}-header-text
                    `}
                >
                    {snapshot.chartName || ''}
                </div>
            </div>
            <div
                className={`
                  ${prefixCls}-body
                `}
            >
                <Chart key={snapshot.chartId} model={model} />
            </div>
        </div>
    );
}

export function Chart(props: { model: ChartRenderModel }) {
    const { model } = props;
    const chartRef = useRef<HTMLDivElement>(null);
    useEffect(() => { model.initChart(chartRef.current!); }, []);

    return (
        <div
            ref={chartRef}
            className={`
              ${prefixCls}-container
            `}
        />
    );
}
