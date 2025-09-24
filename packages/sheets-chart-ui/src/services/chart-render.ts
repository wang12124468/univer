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

import {
    Disposable,
    DrawingTypeEnum,
    ICommandService,
    Inject,
    Injector,
    IUniverInstanceService,
    Nullable,
} from '@univerjs/core';
import { IRenderManagerService } from '@univerjs/engine-render';
import { getSheetCommandTarget } from '@univerjs/sheets';
import { ChartDataSource, createChartDataSource, IChartContext, IChartOption, IChartRange, IChartSnapshot, SheetChartModel, SheetChartSnapshot } from '@univerjs/sheets-chart';
import { ICanvasFloatDom, RemoveSheetDrawingCommand, IDeleteDrawingCommandParams, SheetCanvasFloatDomManagerService } from '@univerjs/sheets-drawing-ui';
import { ISheetSelectionRenderService, SheetCanvasPopManagerService } from '@univerjs/sheets-ui';
import { BehaviorSubject } from 'rxjs';
import { RemoveChartCommand, SetChartSettingVisibleCommand, UpdateChartCommand } from '../commands/commands/sheets-chart.command';
import { Chart, IChartSetOptionOpts } from './chart';
import { SheetsChartBlueprintService } from './sheets-chart-blueprint.service';
import { defaultToOption } from '../blueprint/liner.blueprint';
import { IDrawingManagerService } from '@univerjs/drawing';

interface ReadableChartRender extends ChartRender {
    version: number;
}

export const CHART_SETTING_PANEL_ID = 'CHART_SETTING_PANEL_ID';

export class ChartRender extends Disposable {

    private _chartRenderModels = new Map<string, ChartRenderModel>();
    public readonly version: number = 1;

    constructor(
        public readonly model: SheetChartModel,
        @Inject(Injector) private readonly _injector: Injector
    ) {
        super();

        this._init();
    }

    getChartRenderModel(chartId: string) {
        return this._chartRenderModels.get(chartId);
    }

    private _init() {
        this.model.change$.subscribe(() => this._initChartRenderModels());
        this._initChartRenderModels();
    }

    private _initChartRenderModels() {
        (this as ReadableChartRender).version++;
        const snapshots = this.model.getAllChartSnapshot();
        snapshots.forEach(([chartId, snapshot]) => this.updateOrCreateChartRenderModel(chartId, snapshot));
        this.validate();
        // this._reCalc();
    }

    private updateOrCreateChartRenderModel(chartId: string, snapshot: SheetChartSnapshot) {
        const model: ReadableChartRenderModel = this._chartRenderModels.get(chartId) || this.createChartRenderModel(chartId, snapshot);
        model.version = this.version;
    }

    private createChartRenderModel(chartId: string, snapshot: SheetChartSnapshot) {
        const model = this._injector.createInstance(ChartRenderModel, this.model.unitId, this.model.subUnitId, snapshot);
        this._chartRenderModels.set(chartId, model);
        return model;
    }

    private validate() {
        Array.from(this._chartRenderModels.entries()).forEach(([id, model]) => {
            if (this.version !== model.version) {
                this.removeChartRenderModel(id);
            }
        });
    }

    private removeChartRenderModel(chartId: string) {
        this._chartRenderModels.get(chartId)?.dispose();
        this._chartRenderModels.delete(chartId);
    }

    override dispose(): void {
        this._chartRenderModels.forEach(model => model.dispose());
        this._chartRenderModels.clear();
    }

    // private _reCalc() {

    // }
}

interface ReadableChartRenderModel extends ChartRenderModel {
    version: number;
}

export enum UpdateChartStrategy {
    None, // 不更新
    Update, // 更新
    Rerender // 重新渲染
}

export const CHART_COMPONENT_KEY = 'CHART_COMPONENT_KEY';

export class ChartRenderModel extends Disposable {
    public readonly version: number;
    private chart: Chart;

    private _dataSource: ChartDataSource;
    get dataSource(): Nullable<ChartDataSource> { return this._dataSource; }

    private _option$ = new BehaviorSubject<Nullable<IChartOption>>(null);
    readonly option$ = this._option$.asObservable();
    get option() { return this._option$.getValue(); }

    private _context$ = new BehaviorSubject<Nullable<IChartContext>>(null);
    readonly context$ = this._context$.asObservable();
    get context() { return this._context$.getValue(); }

    get chartId() { return this._sheetChartSnapshot.chartId; }
    get chartType() { return this._sheetChartSnapshot.chartType; }

    get snapshot() { return this._sheetChartSnapshot; }

    constructor(
        public unitId: string,
        public subUnitId: string,
        private _sheetChartSnapshot: SheetChartSnapshot,
        @ICommandService private readonly _commandService: ICommandService,
        @IDrawingManagerService private readonly _drawingManagerService: IDrawingManagerService,
        @Inject(Injector) private readonly _injector: Injector,
        @Inject(SheetCanvasFloatDomManagerService) private readonly _sheetCanvasFloatDomManagerService: SheetCanvasFloatDomManagerService,
        @Inject(IRenderManagerService) private _renderManagerService: IRenderManagerService,
        @Inject(SheetsChartBlueprintService) private _chartBlueprintService: SheetsChartBlueprintService
    ) {
        super();

        this._initModel();
        // setTimeout(() => this._initPanel());
    }

    onApply(snapshot: IChartSnapshot, updateChart = UpdateChartStrategy.Update) {
        this._commandService.executeCommand(UpdateChartCommand.id, { unitId: this.unitId, subUnitId: this.subUnitId, chartId: this.chartId, snapshot });

        if(updateChart === UpdateChartStrategy.Update) {
            this.setChartOption({
                option: this.getChartOption(),
                opts: { replaceMerge: ['xAxis', 'yAxis', 'sereis', 'legend'] }
            });
            return;
        }

        if(updateChart === UpdateChartStrategy.Rerender) {
            this.chart.clear();
            this.setChartOption({ option: this.getChartOption() });
        }
    }

    onApplyWithOpts(snapshot: IChartSnapshot, opts?: IChartSetOptionOpts) {
        this.onApply(snapshot, UpdateChartStrategy.None);
        this.setChartOption({ option: this.getChartOption(), opts });
    }

    setChartOption(chartOption: { option?: IChartOption, opts?: IChartSetOptionOpts }) {
        const { option = {}, opts } = chartOption || {};
        this.chart.setOption(option, opts);
    }

    initChart(element: HTMLElement) {
        this.chart.create(element);
        this.dataSource?.data$.subscribe(dataset => this.setChartOption({ option: this.getChartOption() }));
    }

    getChartOption() {
        const snapshot = this.snapshot.value!;
        const dataset = this.dataSource?.data!;
        const blueprint = this._chartBlueprintService.testBlueprint({ snapshot, dataset });
        if(blueprint?.toOption) return blueprint.toOption({ snapshot, dataset });
        return defaultToOption({ snapshot, dataset });
    }

    private isInitPanel = false;

    private _initPanel(ranges: IChartRange[]) {
        if(this.isInitPanel || !ranges || !ranges.length) { return; }
        this.isInitPanel = true;
        const range = ranges[ranges.length - 1];
        if(this._sheetCanvasFloatDomManagerService.getFloatDomInfo(this.chartId)) {
            return;
        }

        this._sheetCanvasFloatDomManagerService.addFloatDomToPosition({
            componentKey: 'CHART_COMPONENT_KEY',
            unitId: this.unitId,
            subUnitId: this.subUnitId,
            type: DrawingTypeEnum.DRAWING_CHART,
            allowTransform: true,
            initPosition: this.getPosition(range),
            data: {
                unitId: this.unitId,
                subUnitId: this.subUnitId,
                chartId: this.chartId
            }
        }, this.chartId)!;
    }

    private getPosition(range: IChartRange) {
        const selectionRenderService = this._renderManagerService.getRenderById(this.unitId)?.with(ISheetSelectionRenderService);
        const marginX = 48, marginY = 72, width = 520, height = 420;
        const start = selectionRenderService?.getSkeleton().getCellWithCoordByIndex(range.startRow, range.startColumn) || { startX: 0, startY: 0, endX: 0, endY: 0 };
        const startX = start.startX + marginX;
        const startY = start.startY + marginY;
        const endX = startX + width;
        const endY = startY + height;
        return { startX, startY, endX, endY }
    }

    private _initModel() {
        this.disposeWithMe(this._sheetChartSnapshot.config$.subscribe(snapshot => this.updateConfig(snapshot!)));
        this.disposeWithMe(this._sheetChartSnapshot.source$.subscribe(snapshot => this.updateSource(snapshot!)));
        const snapshot = this._sheetChartSnapshot.value;
        this.updateConfig(snapshot);
        this.updateSource(snapshot);
        this._dataSource = createChartDataSource(this.unitId, this.subUnitId, snapshot.range!, this._injector);

        this.chart = new Chart(this);
    }

    private updateConfig(snapshot: IChartSnapshot) {
        this._option$.next(snapshot.option);
        this._context$.next(snapshot.context);
    }

    private updateSource(snapshot: IChartSnapshot) {
        // this.getOrCreateDataSource(snapshot);
        this.dataSource?.setRange(snapshot.range!);
        this._initPanel(snapshot.range!);
    }

    override dispose(): void {
        super.dispose();
        this._option$.complete();
        this.chart?.dispose();
        this.chart = null as any;

        const drawing = this._drawingManagerService.getDrawingByParam({ unitId: this.unitId, subUnitId: this.subUnitId, drawingId: this.chartId });
        if(drawing) {
            this._commandService.executeCommand(RemoveSheetDrawingCommand.id, { unitId: this.unitId, drawings: [drawing] } as IDeleteDrawingCommandParams);
        }
        this._commandService.executeCommand(SetChartSettingVisibleCommand.id, { unitId: this.unitId, subUnitId: this.subUnitId, chartId: this.chartId, visible: false });
    }
}
