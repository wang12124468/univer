import { Disposable, DisposableCollection, IMutationInfo, Inject, Injector, merge, Nullable, Tools } from "@univerjs/core";
import { BehaviorSubject } from "rxjs";
import { ChartType, IChartContext, IChartOption, IChartRange, IChartSnapshot } from "./interface";
import { EffectRefRangeParams, EffectRefRangId, IInsertColCommandParams, IInsertRowCommandParams, IMoveColsCommandParams, IMoveRangeCommandParams, IMoveRowsCommandParams, InsertColCommand, InsertRowCommand, IRemoveColMutationParams, IRemoveRowsMutationParams, MoveRangeCommand, RefRangeService, RemoveColCommand, RemoveRowCommand } from "@univerjs/sheets";
import { ChartUpdateSourceMutation, IChartUpdateSourceMutationParams } from "../commands/mutations/sheets-chart-update-source.mutation";

export class SheetChartModel extends Disposable {

    private _updateTimes = 0;

    private _chartSnapshotById = new Map<string, SheetChartSnapshot>();

    private _change$ = new BehaviorSubject(this._updateTimes);
    readonly change$ = this._change$.asObservable();

    constructor(
        public readonly unitId: string,
        public readonly subUnitId: string,
        @Inject(Injector) public readonly _injector: Injector,
    ) {
        super();
    }

    
    serialize() {
        return this.getAllChartSnapshot().map(([, chartSnapshot]) => chartSnapshot.serialize());
    }

    static deserialize(unitId: string, subUnitId: string, snapshots: IChartSnapshot[], injector: Injector): SheetChartModel {
        const chartModel = injector.createInstance(SheetChartModel, unitId, subUnitId);
        chartModel.dump(snapshots);
        return chartModel;
    }

    private dump(snapshots: IChartSnapshot[]) {
        snapshots.forEach(snapshot => this.setChartSnapshotWithoutReCalc(snapshot.chartId!, snapshot))
    }

    setChartSnapshot(id: string, snapshot: Nullable<IChartSnapshot>) {
        if(!snapshot) {
            this.removeChartSnapshot(id);
            return;
        }
        this.setChartSnapshotWithoutReCalc(id, snapshot);
        this.emit();
    }

    updateChartSnapshot(id: string, snapshot: Nullable<IChartSnapshot>) {
        const chartSnapshot = this.getChartSnapshot(id);
        if(!chartSnapshot) { return false; }
        if(!snapshot) { return true; }
        chartSnapshot.updateSnapshot(snapshot);
    }

    private setChartSnapshotWithoutReCalc(id: string, snapshot: IChartSnapshot) {
        let chartSnapshot: SheetChartSnapshot = this.getChartSnapshot(id)!;
        if(!chartSnapshot) {
            chartSnapshot = this._injector.createInstance(SheetChartSnapshot, this.unitId, this.subUnitId, { ...snapshot, chartId: id });
            this._chartSnapshotById.set(id, chartSnapshot);
        }

        this.emit();
    }


    private removeChartSnapshot(id: string) {
        const chartSnapshot = this.getChartSnapshot(id);
        if(chartSnapshot) {
            chartSnapshot.dispose();
            this._chartSnapshotById.delete(id);
            this.emit();
        }
    }

    private emit() {
        this._change$.next(++this._updateTimes);
    }

    getChartSnapshot(id: string): Nullable<SheetChartSnapshot> {
        return this._chartSnapshotById.get(id);
    }

    getAllChartSnapshot(): [string, SheetChartSnapshot][] {
        return Array.from(this._chartSnapshotById.entries());
    }

}

export class SheetChartSnapshot extends Disposable implements IChartSnapshot {

    private _value$ = new BehaviorSubject<Nullable<IChartSnapshot>>(null);
    readonly value$ = this._value$.asObservable();
    get value(): IChartSnapshot { return this._value$.getValue()! }

    private _config$ = new BehaviorSubject<Nullable<IChartSnapshot>>(null);
    readonly config$ = this._value$.asObservable();
    get config(): IChartSnapshot { return this._config$.getValue()! }

    private _source$ = new BehaviorSubject<Nullable<IChartSnapshot>>(null);
    readonly source$ = this._value$.asObservable();
    get source(): IChartSnapshot { return this._source$.getValue()! }

    private isChartSourceChange = false;
    private isChartConfigChange = false;
    
    public chartId: string = '';
    public chartType?: ChartType = ChartType.None;
    public chartName?: string | undefined;
    public option?: IChartOption;
    public context?: IChartContext;
    public range?: IChartRange[];

    constructor(
        public readonly unitId: string,
        public readonly subUnitId: string,
        snapshot: IChartSnapshot,
        @Inject(RefRangeService) private readonly _refRangeService: RefRangeService,
    ) {
        super();
        this.chartId = snapshot?.chartId || '';
        this.setSnapshot(snapshot || {});
    }

    updateSnapshot(snapshot: IChartSnapshot) {
        this.setSnapshot(snapshot);
    }

    setSnapshot(snapshot: IChartSnapshot, reCalc = true) {
        const { chartType, option, context, range, chartName } = snapshot;
        
        Reflect.has(snapshot, 'chartType') && this.setChartType(chartType!, false);
        Reflect.has(snapshot, 'chartName') && this.setChartName(chartName!, false);
        Reflect.has(snapshot, 'context') && this.setContext(context!, false);
        Reflect.has(snapshot, 'option') && this.setOption(option!, false);
        Reflect.has(snapshot, 'range') && this.setRange(range!, false);
        this._reCalc(reCalc);
    }

    private getValue(): IChartSnapshot { return { chartId: this.chartId, chartType: this.chartType, chartName: this.chartName, option: this.option, context: this.context, range: this.range }; }

    private setChartType(chartType: ChartType, reCalc = true) {
        if(this.chartType === chartType) { return; }
        this.chartType = chartType;
        this.isChartConfigChange = true;
        this._reCalc(reCalc);
    }

    private setChartName(chartName: string, reCalc = true) {
        if(this.chartName === chartName) { return; }
        this.chartName = chartName;
        this.isChartConfigChange = true;
        this._reCalc(reCalc);
    }

    private setOption(option: IChartOption, reCalc = true) {
        this.option = option || null;
        this.isChartConfigChange = true;
        this._reCalc(reCalc);
    }

    private setContext(context: IChartContext, reCalc = true) {
        this.context = context || null;
        this.isChartConfigChange = true;
        this._reCalc(reCalc);
    }

    private setRange(range: IChartRange[], reCalc = true) {
        this.range = range || null;
        this.isChartSourceChange = true;
        this._reCalc(reCalc);
    }

    serialize(): IChartSnapshot {
        return Tools.deepClone(this.value);
    }

    private _reCalc(forceUpdate = true) {
        if(forceUpdate) {
            const value = this.getValue();
            this._value$.next(value);

            if(this.isChartConfigChange) {
                this.isChartConfigChange = false;
                this._config$.next(value);
            }
            if(this.isChartSourceChange) {
                this.isChartSourceChange = false
                this._source$.next(value);
            }
        }
    }

    // private _disposableCollection = new DisposableCollection;

    // private _registerRefRange(unitId: string, subUnitId: string) {
    //     this._disposableCollection.dispose();
    //     const handler = (param: EffectRefRangeParams) => {
    //         switch(param.id) {
    //             case InsertRowCommand.id: {
    //                 const params = param.params as IInsertRowCommandParams;
    //                 const _unitId = params.unitId || unitId;
    //                 const _subUnitId = params.subUnitId || subUnitId;
    //                 return this._handleInsertRowCommand(params, _unitId, _subUnitId);
    //             }
    //             case InsertColCommand.id: {
    //                 const params = param.params as IInsertColCommandParams;
    //                 const _unitId = params.unitId || unitId;
    //                 const _subUnitId = params.subUnitId || subUnitId;
    //                 return this._handleInsertColCommand(params, _unitId, _subUnitId);
    //             }
    //             case RemoveColCommand.id: {
    //                 const params = param.params as IRemoveColMutationParams;
    //                 return this._handleRemoveColCommand(params, unitId, subUnitId);
    //             }
    //             case RemoveRowCommand.id: {
    //                 const params = param.params as IRemoveRowsMutationParams;
    //                 return this._handleRemoveRowCommand(params, unitId, subUnitId);
    //             }
    //             case EffectRefRangId.MoveColsCommandId: {
    //                 const params = param.params as IMoveColsCommandParams;
    //                 return this._handleMoveColsCommand(params, unitId, subUnitId);
    //             }
    //             case EffectRefRangId.MoveRowsCommandId: {
    //                 const params = param.params as IMoveRowsCommandParams;
    //                 return this._handleMoveRowsCommand(params, unitId, subUnitId);
    //             }
    //             case MoveRangeCommand.id: {
    //                 const params = param.params as IMoveRangeCommandParams;
    //                 return this._handleMoveRangeCommand(params, unitId, subUnitId);
    //             }
    //         }

    //         return this._handleNull();
    //     }

    //     if(this.range) {
    //         this._disposableCollection.add(this._refRangeService.registerRefRange(this.range!, handler, unitId, subUnitId));
    //     }
    // }

    // private _handleInsertRowCommand(params: IInsertRowCommandParams, unitId: string, subUnitId: string) {
    //     if(!this.range) { return this._handleNull(); }

    //     const { startRow, endRow } = this.range;
    //     const { startRow: insertStartRow, endRow: insertEndRow } = params.range;

    //     if(insertEndRow > endRow) { return this._handleNull(); }

    //     const rowCount = insertEndRow - insertStartRow + 1;

    //     const redos: IMutationInfo[] = [];
    //     const undos: IMutationInfo[] = [];
    //     const chartUpdateSourceMutationParams: IChartUpdateSourceMutationParams = {
    //         unitId,
    //         subUnitId,
    //         chartId: this.chartId,
    //         range: {
    //             ...this.range,
    //             startRow: insertStartRow <= startRow ? startRow + rowCount : startRow,
    //             endRow: endRow + rowCount
    //         }
    //     };

    //     const undoChartUpdateSourceMutationParams: IChartUpdateSourceMutationParams = {
    //         unitId,
    //         subUnitId,
    //         chartId: this.chartId,
    //         range: { ...this.range }
    //     };

    //     redos.push({ id: ChartUpdateSourceMutation.id, params: chartUpdateSourceMutationParams });
    //     undos.push({ id: ChartUpdateSourceMutation.id, params: undoChartUpdateSourceMutationParams });
        
    //     return { redos, undos };
    // }

    // private _handleInsertColCommand(params: IInsertColCommandParams, unitId: string, subUnitId: string) {
    //     if(!this.range) { return this._handleNull(); }

    //     const { startColumn, endColumn } = this.range;
    //     const {startColumn: insertStartColumn, endColumn: insertEndColumn } = params.range;

    //     if(insertEndColumn > endColumn) { return this._handleNull(); }

    //     const colCount = insertEndColumn - insertStartColumn + 1;

    //     const redos: IMutationInfo[] = [];
    //     const undos: IMutationInfo[] = [];
    //     const chartUpdateSourceMutationParams: IChartUpdateSourceMutationParams = {
    //         unitId,
    //         subUnitId,
    //         chartId: this.chartId,
    //         range: {
    //             ...this.range,
    //             startColumn: insertStartColumn <= startColumn ? startColumn + colCount : startColumn,
    //             endColumn: endColumn + colCount
    //         }
    //     };

    //     const undoChartUpdateSourceMutationParams: IChartUpdateSourceMutationParams = {
    //         unitId,
    //         subUnitId,
    //         chartId: this.chartId,
    //         range: { ...this.range }
    //     };

    //     redos.push({ id: ChartUpdateSourceMutation.id, params: chartUpdateSourceMutationParams });
    //     undos.push({ id: ChartUpdateSourceMutation.id, params: undoChartUpdateSourceMutationParams });
        
    //     return { redos, undos };
    // }

    // private _handleRemoveRowCommand(config: IRemoveRowsMutationParams, unitId: string, subUnitId: string) {
    //     if(!this.range) { return this._handleNull(); }
    //     const { startRow, endRow } = this.range;
    //     const { startRow: removeStartRow, endRow: removeEndRow } = config.range;
        
    //     if (removeStartRow > endRow) { return this._handleNull(); }

    // }

    // private _handleNull() {
    //     return { redos: [], undos: [] };
    // }
}