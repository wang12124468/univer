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

import type {
    IUnitRangeName,
    Nullable,
    Workbook,
    Worksheet,
} from '@univerjs/core';
import type { IChartRange, SheetChartModel } from '@univerjs/sheets-chart';
import type { IDeleteDrawingCommandParams } from '@univerjs/sheets-drawing-ui';
import {
    Disposable,
    DisposableCollection,
    DrawingTypeEnum,
    ICommandService,
    Inject,
    Injector,
    isValidRange,
    IUniverInstanceService,
    UniverInstanceType,
} from '@univerjs/core';
import { IDrawingManagerService } from '@univerjs/drawing';
import { deserializeRangeWithSheet } from '@univerjs/engine-formula';
import { getSheetCommandTarget } from '@univerjs/sheets';
import { SheetsChartService } from '@univerjs/sheets-chart';
import { RemoveSheetDrawingCommand } from '@univerjs/sheets-drawing-ui';
import { IMarkSelectionService, SheetCanvasPopManagerService } from '@univerjs/sheets-ui';
import { ISidebarService } from '@univerjs/ui';
import { BehaviorSubject, of, switchMap } from 'rxjs';
import { register } from '../blueprint/useDefault';
import { RemoveChartCommand, ToggleChartSettingVisibleCommand } from '../commands/commands/sheets-chart.command';
import { CHART_SETTING_PANEL_ID, ChartRender } from './chart-render';
import { SheetsChartBlueprintService } from './sheets-chart-blueprint.service';

export class SheetsChartUIService extends Disposable {
    private _chartRenders = new Map<string, Map<string, ChartRender>>();

    private _activeChart$ = new BehaviorSubject<Nullable<{ id: string; unitId: string; subUnitId: string; chartId: string }>>(null);
    readonly activeChart$ = this._activeChart$.asObservable();
    get activeChart() { return this._activeChart$.getValue(); }

    constructor(
        @IMarkSelectionService private readonly _markSelectionService: IMarkSelectionService,
        @IUniverInstanceService private readonly _instanceService: IUniverInstanceService,
        @IDrawingManagerService private readonly _drawingManagerService: IDrawingManagerService,
        @ICommandService private readonly _commandService: ICommandService,
        @ISidebarService private readonly _sidebarService: ISidebarService,
        @Inject(SheetsChartService) private readonly _sheetsChartService: SheetsChartService,
        @Inject(Injector) private readonly _injector: Injector,
        @Inject(SheetCanvasPopManagerService) private readonly _canvasPopManager: SheetCanvasPopManagerService,
        @Inject(SheetsChartBlueprintService) private readonly _blueprintService: SheetsChartBlueprintService

    ) {
        super();

        this._init();
    }

    private _init() {
        this.disposeWithMe(this._sheetsChartService.activeChartModel$.subscribe((model) => this._setChartRender(model!)));
        this._canvasPopManager.registerFeatureMenu(DrawingTypeEnum.DRAWING_CHART, this._getPopupMenuItem);
        register(this._blueprintService);

        const sheetUnit$ = this._instanceService
            .getCurrentTypeOfUnit$<Workbook>(UniverInstanceType.UNIVER_SHEET)
            .pipe(
                switchMap((workbook) => workbook ? workbook.activeSheet$ : of(null))
            );

        this.disposeWithMe(sheetUnit$.subscribe((worksheet) => this._groupChartSettingPanel(worksheet)));

        this._sidebarService.sidebarOptions$.subscribe((option) => {
            if (this.activeChart && this.activeChart.id !== option.id) {
                this._activeChart$.next(null);
            }
        });

        this._drawingManagerService.focus$.subscribe((drawings) => {
            const { unitId, subUnitId } = getSheetCommandTarget(this._instanceService) || {};
            if (!unitId || !subUnitId) { return; }

            let chartId: string = '';
            drawings.forEach((drawing) => {
                const { unitId: _unitId, subUnitId: _subUnitId, drawingId: _chartId } = drawing;
                if (unitId !== _unitId || subUnitId !== _subUnitId || !this.getChartRenderModel(_unitId, _subUnitId, _chartId)) { return; }
                chartId = _chartId;
            });

            this.onChartActive(unitId, subUnitId, chartId);
        });
        this._commandService.onCommandExecuted((command) => {
            if (command.id === RemoveSheetDrawingCommand.id) {
                const { drawings } = command.params as IDeleteDrawingCommandParams;
                drawings.forEach(drawing => {
                    const { unitId, subUnitId, drawingId: chartId } = drawing;
                    this._sheetsChartService.getChartModel(unitId, subUnitId)?.setChartSnapshot(chartId);
                });
            }
        });
    }

    private onChartActive = (unitId: string, subUnitId: string, chartId?: string) => {
        const orders = this._drawingManagerService.getDrawingOrder(unitId, subUnitId);
        orders.map((id) => document.getElementById(id)?.parentElement?.classList.remove('sheets-chart-ui-active'));
        if (!chartId) { return; }
        document.getElementById(chartId)?.parentElement?.classList.add('sheets-chart-ui-active');
        const siderbarOptions = this._sidebarService.options;
        if (siderbarOptions?.visible && siderbarOptions.id?.startsWith(`${unitId}-${subUnitId}-`)) {
            this.openChartSettingPanel(unitId, subUnitId, chartId);
        }
    };

    private _groupChartSettingPanel(worksheet: Nullable<Worksheet>) {
        if (!this._sidebarService.visible) { return; }
        if (!worksheet) { return this.closeChartSettingPanel(); }
        const _id = `${worksheet.getUnitId()}-${worksheet.getSheetId()}`;
        const id = this._sidebarService.options.id || '';
        if (id.startsWith(_id)) { return; }
        this.closeChartSettingPanel();
    }

    private _getPopupMenuItem = (unitId: string, subUnitId: string, drawingId: string, _drawingType: DrawingTypeEnum) => {
        if (!this.getChartRenderModel(unitId, subUnitId, drawingId)) { return []; }
        const params = { unitId, subUnitId, chartId: drawingId };
        const menus = [
            {
                label: '设置',
                index: 1,
                commandId: ToggleChartSettingVisibleCommand.id,
                commandParams: params,
                disable: false,
            },
            {
                label: '删除',
                index: 2,
                commandId: RemoveChartCommand.id,
                commandParams: params,
                disable: false,
            },
        ];
        return menus;
    };

    private _setChartRender(model: SheetChartModel) {
        if (!model) { return null; }
        let chartRender = this._chartRenders.get(model.unitId)?.get(model.subUnitId);
        if (chartRender) {
            if (chartRender.model === model) { return; }
            chartRender.dispose();
        }

        chartRender = this._createChartRender(model);
        const chartRenders = this._chartRenders.get(model.unitId) || new Map();
        chartRenders.set(model.subUnitId, chartRender);
        this._chartRenders.set(model.unitId, chartRenders);
        // this._reCalc();
    }

    private _createChartRender(model: SheetChartModel) {
        return this._injector.createInstance(ChartRender, model);
    }

    getChartRenderModel(unitId: string, subUnitId: string, chartId: string) {
        return this.getChartRender(unitId, subUnitId)?.getChartRenderModel(chartId);
    }

    getChartRender(unitId: string, subUnitId: string) {
        return this._chartRenders.get(unitId)?.get(subUnitId);
    }

    private _highlightDisposable: DisposableCollection;

    highlight(range?: IChartRange | IChartRange[]) {
        this._highlightDisposable?.dispose();
        if (!range) { return; }
        this._highlightDisposable = new DisposableCollection();
        const ranges = Array.isArray(range) ? range : [range];
        ranges.map((range) => {
            const id = this._markSelectionService.addShape({ range, primary: null })!;
            this._highlightDisposable.add({ dispose: () => id && this._markSelectionService.removeShape(id) });
        });
        this.disposeWithMe(this._highlightDisposable);
    }

    deserializeRangeWithSheet(refString: string): Nullable<IUnitRangeName | { range: IChartRange[] }> {
        const [sheetName, ...refStrings] = refString.split(/[!,]/);
        const ranges: IChartRange[] = [];
        for (const ref of refStrings) {
            const range = deserializeRangeWithSheet(ref.trim()).range;
            if (!isValidRange(range)) { return null; }
            ranges.push(range);
        }

        return { unitId: '', sheetName, range: ranges };
    }

    serializeRangeWithSheet(range: { unitId: string; sheetName: string; range: IChartRange[] }) {
        const target = getSheetCommandTarget(this._instanceService, { unitId: range.unitId, subUnitId: range.sheetName });
        if (!target) { return ''; }
        const ranges = Array.isArray(range.range) ? range.range : [range.range];
        const a1Notation = ranges.flatMap((range) => {
            const a1Notation = target?.worksheet.getRange(range).getA1Notation();
            return a1Notation ? [a1Notation] : [];
        }).join(',');
        if (!a1Notation) { return ''; }
        return `${target.worksheet.getName()}!${a1Notation}`;
    }

    toggleChartSettingPanel(unitId: string, subUnitId: string, chartId: string) {
        if (!this._sidebarService.visible) {
            this.openChartSettingPanel(unitId, subUnitId, chartId);
            return;
        }

        const id = `${unitId}-${subUnitId}-${chartId}`;
        if (this._sidebarService.options.id !== id) {
            this.openChartSettingPanel(unitId, subUnitId, chartId);
            return;
        }

        this.closeChartSettingPanel();
    }

    openChartSettingPanel(unitId: string, subUnitId: string, chartId: string) {
        const id = `${unitId}-${subUnitId}-${chartId}`;
        this._sidebarService.open({
            id,
            header: { title: '图编辑' },
            children: { label: { name: CHART_SETTING_PANEL_ID, props: { unitId, subUnitId, chartId } } },
            width: 360,
            onClose: () => {
                this._activeChart$.next(null);
            },
        });
        // this.onChartEditActive(unitId, subUnitId, chartId);
    }

    closeChartSettingPanel(unitId?: string, subUnitId?: string, chartId?: string) {
        if (!this._sidebarService.visible) { return; }
        const _id = [unitId, subUnitId, chartId].filter(Boolean).join('-');
        const id = this._sidebarService.options.id || '';
        if (!id.startsWith(_id)) { return; }
        this._sidebarService.close(id);
        // if(unitId && subUnitId) { return this.onChartEditActive(unitId, subUnitId); }
        // const target = getSheetCommandTarget(this._instanceService);
        // if(target) {
        //     this.onChartEditActive(target.unitId, target.subUnitId);
        // }
    }

    override dispose(): void {
        super.dispose();
        this._chartRenders.forEach((renders) => renders.forEach((render) => render.dispose()));
        this._chartRenders.clear();
    }
}
