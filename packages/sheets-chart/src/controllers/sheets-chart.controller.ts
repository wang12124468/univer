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


import { Disposable, ICommandService } from '@univerjs/core';
import { ChartUpdateConfigCommand } from '../commands/commands/sheets-chart-update-config.command';
import { ChartUpdateSourceCommand } from '../commands/commands/sheets-chart-update-source.command';
import { ChartUpdateConfigMutation } from '../commands/mutations/sheets-chart-update-config.mutation';
import { ChartUpdateSourceMutation } from '../commands/mutations/sheets-chart-update-source.mutation';
import { InsertSheetsChartMutation, RemoveSheetsChartMutation, UpdateSheetsChartMutation } from '../commands/mutations/sheets-chart.mutation';

export class SheetsChartController extends Disposable {
    constructor(
        @ICommandService private readonly _commandService: ICommandService,
    ) {
        super();
        this._initCommands();
    }

    private _initCommands(): void {
        [
            ChartUpdateConfigCommand,
            ChartUpdateSourceCommand,
            ChartUpdateConfigMutation,
            ChartUpdateSourceMutation,
            InsertSheetsChartMutation,
            RemoveSheetsChartMutation,
            UpdateSheetsChartMutation
        ].forEach((command) => this.disposeWithMe(this._commandService.registerCommand(command)));
    }
}
