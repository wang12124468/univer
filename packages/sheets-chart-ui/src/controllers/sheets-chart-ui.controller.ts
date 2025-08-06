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


import { Disposable, ICommandService, Inject, Injector } from '@univerjs/core';
import { ComponentManager, connectInjector, IMenuManagerService } from '@univerjs/ui';
import { CHART_COMPONENT_KEY, CHART_SETTING_PANEL_ID } from '../services/chart-render';
import { PrintChart } from '../views/print-chart/PrintChat';
import { menuSchema } from './menu.schema';
import { InsertChartCommand, RemoveChartCommand, SetChartSettingVisibleCommand, ToggleChartSettingVisibleCommand, UpdateChartCommand } from '../commands/commands/sheets-chart.command';
import { EditChart } from '../views/edit-chart';
import { ChartIcon, ColumnChartIcon, LineChartIcon, PieChartIcon, RadarChartIcon, ScatterChartIcon } from '@univerjs/icons';
import { InsertBarChartCommand, InsertLinerChartCommand, InsertPieChartCommand, InsertRadarChartCommand, InsertScatterChartCommand, SmartInsertChartCommand } from '../commands/operations/sheets-chart.operation';

export class SheetsChartUIController extends Disposable {
    constructor(
        @ICommandService private readonly _commandService: ICommandService,
        @IMenuManagerService private readonly _menuManagerService: IMenuManagerService,
        @Inject(ComponentManager) private readonly _componentManager: ComponentManager,
        @Inject(Injector) private readonly _injector: Injector
    ) {
        super();
        this._initUI();
        this._initMenus();
        this._initCommands();
    }

    private _initUI() {
        this.disposeWithMe(this._componentManager.register('ChartIcon', ChartIcon));
        this.disposeWithMe(this._componentManager.register('LineChartIcon', LineChartIcon));
        this.disposeWithMe(this._componentManager.register('ColumnChartIcon', ColumnChartIcon));
        this.disposeWithMe(this._componentManager.register('PieChartIcon', PieChartIcon));
        this.disposeWithMe(this._componentManager.register('RadarChartIcon', RadarChartIcon));
        this.disposeWithMe(this._componentManager.register('ScatterChartIcon', ScatterChartIcon));
        this.disposeWithMe(this._componentManager.register(CHART_COMPONENT_KEY, connectInjector(PrintChart, this._injector)));
        this.disposeWithMe(this._componentManager.register(CHART_SETTING_PANEL_ID, connectInjector(EditChart, this._injector)));
    }

    private _initMenus() {
        this._menuManagerService.mergeMenu(menuSchema);
    }

    private _initCommands(): void {
        [
            InsertChartCommand,
            RemoveChartCommand,
            UpdateChartCommand,
            ToggleChartSettingVisibleCommand,
            SetChartSettingVisibleCommand,
            SmartInsertChartCommand,
            InsertLinerChartCommand,
            InsertBarChartCommand,
            InsertPieChartCommand,
            InsertRadarChartCommand,
            InsertScatterChartCommand
        ].forEach((command) => this.disposeWithMe(this._commandService.registerCommand(command)));
    }
}
