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
    Inject,
    Injector,
    IResourceManagerService,
    IUniverInstanceService,
    Nullable,
    UniverInstanceType,
    Workbook,
} from '@univerjs/core';
import { getSheetCommandTarget } from '@univerjs/sheets';
import { BehaviorSubject, of, switchMap } from 'rxjs';
import { IChartSnapshot } from './interface';
import { SheetChartModel } from './chart-model';

export const SHEET_CHART_SNAPSHOT_ID = 'SHEET_CHART_PLUGIN';

type WorksheetID = string;
export interface ISheetsChartResource {
    [key: WorksheetID]: IChartSnapshot[]
}

export class SheetsChartService extends Disposable {

    private _chartModels = new Map<string, Map<string, SheetChartModel>>();
    private _activeChartModel$ = new BehaviorSubject<Nullable<SheetChartModel>>(null);
    readonly activeChartModel$ = this._activeChartModel$.asObservable();
    get activeChartModel() { return this._activeChartModel$.getValue(); }

    constructor(
        @IResourceManagerService private readonly _resourcesManagerService: IResourceManagerService,
        @IUniverInstanceService private readonly _univerInstanceService: IUniverInstanceService,
        @Inject(Injector) private readonly _injector: Injector
    ) {
        super();

        this._initModel();
        this._initActiveChartModel();
    }

    getOrCreateChartModel(unitId: string, subUnitId: string) {
        return this.getChartModel(unitId, subUnitId) || this.createChartModel(unitId, subUnitId);
    }

    getChartModel(unitId: string, subUnitId: string) {
        return this._chartModels.get(unitId)?.get(subUnitId) ?? null;
    }

    private _initModel() {
        this._resourcesManagerService.registerPluginResource<ISheetsChartResource>({
            pluginName: SHEET_CHART_SNAPSHOT_ID,
            businesses: [UniverInstanceType.UNIVER_SHEET],
            toJson: (unitId) => {
                const allChartModels = this._chartModels.get(unitId);
                if(!allChartModels) { return '{}'; }
                const json: any = {};
                allChartModels.forEach((model, worksheetId) => {
                    json[worksheetId] = model.serialize();
                });
                return JSON.stringify(json);
            },
            parseJson: (json) => JSON.parse(json),
            onLoad: (unitId, resource) => {
                Object.keys(resource).map(worksheetId => {
                    const snapshots = resource[worksheetId];
                    const chartModel =  SheetChartModel.deserialize(unitId, worksheetId, snapshots, this._injector);
                    this.cacheChartModel(unitId, worksheetId, chartModel);
                });
                this.updateActiveChartModel();
            },
            onUnLoad: (unitId) => {
                const allChartModels = this._chartModels.get(unitId);
                if(!allChartModels) { return; }
                allChartModels.forEach(model => model.dispose());
                this._chartModels.delete(unitId);
            },
        })
    }

    private _initActiveChartModel() {
        this.disposeWithMe(
             this._univerInstanceService.getCurrentTypeOfUnit$<Workbook>(UniverInstanceType.UNIVER_SHEET)
                .pipe(switchMap(workbook => workbook?.activeSheet$ ?? of(null)))
                .subscribe(() => this.updateActiveChartModel())
        )
    }

    private createChartModel(unitId: string, subUnitId: string) {
        const newChartModel = this._injector.createInstance(SheetChartModel, unitId, subUnitId);
        this.cacheChartModel(unitId, subUnitId, newChartModel);
        this.updateActiveChartModel();
        return newChartModel;
    }

    private cacheChartModel(unitId: string, subUnitId: string, model: any) {
        if(!this._chartModels.has(unitId)) {
            this._chartModels.set(unitId, new Map);
        }
        this._chartModels.get(unitId)!.set(subUnitId, model);
    }

    private updateActiveChartModel() {
        const target = getSheetCommandTarget(this._univerInstanceService);
        if(!target) {
            this._activeChartModel$.next(null);
            return;
        }
        const chartModel = this.getChartModel(target.unitId, target.subUnitId);
        this._activeChartModel$.next(chartModel);
    }
}
