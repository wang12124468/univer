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

import type { IChartSnapshot } from '@univerjs/sheets-chart';
import type { ISelectOption, ISettingConfig } from '../interface';
import { DraggableList, Input, Select } from '@univerjs/design';
import { useDependency } from '@univerjs/ui';
import { useCallback, useContext, useMemo } from 'react';
import { SheetsChartUIService } from '../../../../services/sheets-chart-ui.service';
import { registerComponent } from '../../widget';
import { ChartItem } from '../common/chart-item';
import { Tools } from '../common/tools';
import { Context } from '../context/Context';
import { useSettingHook } from './hook/useSettingHook';
import { SequenceIcon } from '@univerjs/icons';
import './style/index.less';
import { UpdateChartStrategy } from '../../../../services/chart-render';
import { merge } from '@univerjs/core';

export interface IPieSettingConfig extends ISettingConfig {

}

const prefixCls = Tools.getPrefixCls('pie-setting');

export function PieSetting() {
    const chartUIService = useDependency(SheetsChartUIService);

    const { model, snapshot, dataset, unitId, subUnitId } = useContext(Context)!;

    const { settings, categories, temp, setTemp, getDefaultSeriesIndexes } = useSettingHook(unitId, subUnitId, snapshot, dataset);

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
        let _seriesIndexes = seriesIndexes.map(v => +v.id);
        if(action === 'add') {
            _seriesIndexes.push(+item.id);
        } else if(action === 'update') {
            _seriesIndexes[+index] = +item.id
        } else {
            _seriesIndexes.splice(+index, 1);
        }

        const data: IChartSnapshot = { context: { ...snapshot.context, seriesIndexes: _seriesIndexes } };
        model.onApplyWithOpts(merge({}, snapshot, data), { replaceMerge: ['xAxis', 'yAxis', 'series'] });
    }, [seriesIndexes, snapshot, model]);

    return (
        <div
            className={`
              ${prefixCls}
            `}
        >
            <ChartItem title="数据范围">
                <Input value={settings.refString} onChange={onChangeRange} onFocus={onFocusRange} onBlur={onApplyRange} onKeyDown={(e) => e.code === 'enter' && onApplyRange()} />
            </ChartItem>
            <ChartItem title="类目">
                <Select className="univer-w-full" value={`${settings.categoryIndex}`} options={categories} onChange={(e) => onApplyCategory(+e)} />
            </ChartItem>
            <ChartItem title="系列" >
                <DraggableList
                    list={seriesIndexes.slice(0, 1)}
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

registerComponent('chart-setting.pie', PieSetting);

interface ISeryItemProps {
    item: { id: string|number };
    options: ISelectOption[];
    onSelect: (item: ISelectOption) => void;
    onDelete: () => void;
}

function SeryItem(props: ISeryItemProps) {
    const { item, options, onSelect } = props;

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
                {/* <CloseIcon className={`${prefixCls}-action`} onClick={() => onDelete()} /> */}
            </div>
        </div>
    );
}
