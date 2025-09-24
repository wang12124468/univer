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

import type { IChartContext, IChartSnapshot } from '@univerjs/sheets-chart';
import type { ISelectOption, ISettingConfig } from '../interface';
import { DraggableList, Input, Segmented, Select } from '@univerjs/design';
import { useDependency } from '@univerjs/ui';
import { useCallback, useContext, useEffect, useMemo } from 'react';
import { SheetsChartUIService } from '../../../../services/sheets-chart-ui.service';
import { registerComponent } from '../../widget';
import { ChartItem } from '../common/chart-item';
import { Tools } from '../common/tools';
import { Context } from '../context/Context';
import { useSettingHook } from './hook/useSettingHook';
import { SequenceIcon, CloseIcon, PlusSingle } from '@univerjs/icons';
import './style/index.less';
import { merge } from '@univerjs/core';
import { UpdateChartStrategy } from '../../../../services/chart-render';

export interface ILinerSettingConfig extends ISettingConfig {
    subType?: 'normal' | 'smooth' | 'step';
}

const prefixCls = Tools.getPrefixCls('liner-setting');

export function LinerSetting() {
    const chartUIService = useDependency(SheetsChartUIService);

    const { model, snapshot, dataset, unitId, subUnitId } = useContext(Context)!;

    const { settings, categories, temp, setTemp, getNextSery, isFullSeries, getDefaultSeriesIndexes } = useSettingHook(unitId, subUnitId, snapshot, dataset);

    const onApplySubType = useCallback((newSery: { smooth: boolean; step: boolean | string }) => {
        const update = (sery: object) => {
            if (!sery) { return sery; }
            return { ...sery, ...newSery };
        };

        const series = snapshot?.option?.series;
        const data: IChartSnapshot = { option: { series: Array.isArray(series) ? series.map(update) : update(series!) } };
        model.onApplyWithOpts(merge({}, snapshot, data), { replaceMerge: 'series' });
    }, [snapshot, model]);

    const onChangeRange = useCallback((refString: string) => {
        const sheetRange = chartUIService.deserializeRangeWithSheet(refString);
        const newTemp = {
            refString,
            range: sheetRange?.range,
            refStringError: !sheetRange
        }
        setTemp(Object.assign({}, temp, newTemp));
        if (!sheetRange?.range) { return; }
        chartUIService.highlight(sheetRange?.range);
    }, [temp]);

    const onApplyRange = useCallback(() => {
        const range = temp.range;
        chartUIService.highlight();
        if (!range) { return; }
        const data: IChartSnapshot = { range };
        model.onApply(merge({}, snapshot, data), UpdateChartStrategy.None);
    }, [temp, snapshot, model]);

    const onFocusRange = useCallback(() => {
        chartUIService.highlight(snapshot?.range);
    }, [snapshot]);

    const onApplyCategory = useCallback((categoryIndex: any) => {
        const snapshot = model.snapshot.value!;
        const dataset = model.dataSource?.data!;
        const data: IChartSnapshot = { context: { ...snapshot.context, categoryIndex, seriesIndexes: getDefaultSeriesIndexes(dataset, categoryIndex) } };
        model.onApplyWithOpts(merge({}, snapshot, data), { replaceMerge: ['series', 'xAxis', 'yAxis'] });
    }, [model]);

    const seriesIndexes = useMemo(() => (settings.seriesIndexes || []).map((index) => ({ id: index + '' })), [settings]);

    const onApplySeries = useCallback((seryOrSeries: { item: { id: string|number }, index: string|number, action: 'add' | 'update' | 'delete' } | { id: string|number }[]) => {
        if(Array.isArray(seryOrSeries)) {
            if(Tools.isSameSeriesIndexes(seryOrSeries.map(v => v.id), seriesIndexes.map(v => v.id))) {
                return;
            }
            const data: IChartSnapshot = { context: { ...snapshot.context, seriesIndexes: seryOrSeries.map(sery => +sery.id) } };
            model.onApplyWithOpts(merge({}, snapshot, data), { replaceMerge: ['xAxis', 'yAxis', 'series'] });
            return;
        }
        const { item, index, action } = seryOrSeries;
        const _seriesIndexes = seriesIndexes.map(v => +v.id);
        if(action === 'add') {
            _seriesIndexes.push(+item.id);
        } else if(action === 'update') {
            _seriesIndexes[+index] = +item.id
        } else {
            _seriesIndexes.splice(+index, 1);
        }

        const data: IChartSnapshot = { context: { seriesIndexes: _seriesIndexes } };
        Object.assign(snapshot.context || {} as object, { seriesIndexes: [] });
        model.onApplyWithOpts(merge({}, snapshot, data), { replaceMerge: ['xAxis', 'yAxis', 'series'] });
    }, [seriesIndexes, snapshot, model]);

    return (
        <div
            className={`
              ${prefixCls}
            `}
        >
            <ChartItem style={{ marginTop: -8 }}>
                <Segmented
                    value={settings.subType}
                    items={[
                        { value: 'normal', label: '折线' },
                        { value: 'smooth', label: '平滑' },
                        { value: 'step', label: '阶梯' },
                    ]}
                    onChange={(e) => {
                        const value: { smooth: boolean; step: boolean | string } = { smooth: false, step: false };
                        if (e === 'smooth') {
                            value.smooth = true;
                        }
                        if (e === 'step') {
                            value.step = 'end';
                        }
                        onApplySubType(value);
                    }}
                />
            </ChartItem>
            <ChartItem title="数据范围">
                <Input value={settings.refString} onChange={onChangeRange} onFocus={onFocusRange} onBlur={onApplyRange} onKeyDown={(e) => e.code === 'enter' && onApplyRange()} />
            </ChartItem>
            <ChartItem title="类目">
                <Select className="univer-w-full" value={`${settings.categoryIndex}`} options={categories} onChange={onApplyCategory} />
            </ChartItem>
            <ChartItem title="系列" actions={<PlusSingle className={`${prefixCls}-action ${isFullSeries ? 'disabled' : ''}`} onClick={() => !isFullSeries && onApplySeries({ item: { id: getNextSery()! }, index: 0, action: 'add' })}/>}>
                <DraggableList
                    list={seriesIndexes}
                    // onListChange={() => {}}
                    onListChange={onApplySeries}
                    idKey="id"
                    draggableHandle="[data-u-comp=sort-panel-item-handler]"
                    itemRender={(item, index) => (
                        <SeryItem
                            item={item}
                            options={Tools.calcSeries(categories, seriesIndexes.map(v => v.id).concat([settings.categoryIndex + '']), [item.id])}
                            onSelect={(item) => onApplySeries({ item: { id: item.value }, index, action: 'update' })}
                            onDelete={() => onApplySeries({ item, index, action: 'delete' })}
                        />
                    )}
                    rowHeight={28}
                    margin={[0, 12]}
                />
            </ChartItem>
        </div>
    );
}

registerComponent('chart-setting.liner', LinerSetting);

interface ISeryItemProps {
    item: { id: string|number };
    options: ISelectOption[];
    onSelect: (item: ISelectOption) => void;
    onDelete: () => void;
}

function SeryItem(props: ISeryItemProps) {
    const { item, options, onSelect, onDelete } = props;

    return (
        <div
            className={`
              ${prefixCls}-sery-item
            `}
        >
            <div
                className={`
                  ${prefixCls}-sery-item-handler
                `}
                data-u-comp="sort-panel-item-handler"
            >
                <SequenceIcon />
            </div>
            <Select
                className={`
                  ${prefixCls}-sery-item-select
                `}
                value={`${item.id}`}
                options={options}
                onChange={(e, item) => onSelect(item)}
            >
            </Select>
            <div
                className={`
                  ${prefixCls}-sery-item-actions
                `}
            >
                <CloseIcon className={`${prefixCls}-action`} onClick={() => onDelete()} />
            </div>
        </div>
    );
}
