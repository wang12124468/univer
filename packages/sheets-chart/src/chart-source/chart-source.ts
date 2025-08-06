import { CellValue, Disposable, DisposableCollection, ICellData, ICommandService, IDisposable, Inject, Injector, IRange, isNullCell, IUniverInstanceService, Nullable, RANGE_TYPE, UniverInstanceType, Workbook, Worksheet } from "@univerjs/core";
import { BehaviorSubject, debounceTime, Subject } from "rxjs";
import { IChartDataset, IChartRange } from "../services/interface";
import { COMMAND_LISTENER_VALUE_CHANGE, getSheetCommandTarget, getValueChangedEffectedRange, RefRangeService, SetColHiddenMutation, SetColVisibleMutation, SetRowHiddenMutation, SetRowVisibleMutation } from "@univerjs/sheets";
import { FormulaExecutedStateType, ISetFormulaCalculationNotificationMutation, SetFormulaCalculationNotificationMutation } from "@univerjs/engine-formula";

type IChartDataSourceRange = IChartRange | IChartRange[];

interface IChartDataRange {
    startRow: Nullable<number>;
    endRow: Nullable<number>;
    ranges: Nullable<IChartRange[]>
}

export class ChartDataSource extends Disposable {
    private dataRange: IChartRange[];
    private _data$ = new BehaviorSubject<Nullable<IChartDataset>>({ dimensions: [], source: [] });
    readonly data$ = this._data$.asObservable();
    get data() { return this._data$.getValue(); }

    private _change$ = new Subject<void>();

    constructor(
        public readonly unitId: string,
        public readonly subUnitId: string,
        range: IChartDataSourceRange,
        @ICommandService private readonly _commandService: ICommandService,
        @IUniverInstanceService private readonly _univerInstanceService: IUniverInstanceService,
        @Inject(RefRangeService) private readonly _refRangeService: RefRangeService
    ) {
        super();
        this.setRange(range);

        this.init();
    }

    private init() {
        this._commandService.onCommandExecuted(command => {
            if(SetFormulaCalculationNotificationMutation.id === command.id) {
                
                const params = command.params as ISetFormulaCalculationNotificationMutation;

                if (params.functionsExecutedState === FormulaExecutedStateType.SUCCESS) {
                    this._change$.next();
                    console.log('chart-source trigger update');
                }
                return;
            }
            if (COMMAND_LISTENER_VALUE_CHANGE.includes(command.id)) {
                const target = getSheetCommandTarget(this._univerInstanceService, { unitId: this.unitId, subUnitId: this.subUnitId });
                if (!target) { return; }
                const ranges = getValueChangedEffectedRange(command);
                if (ranges.some(range => this.checkInRange(range.range))) {
                    this._change$.next();
                    console.log('chart-source trigger update');
                }
                return;
            }

            if (
                [SetColHiddenMutation.id,
                SetColVisibleMutation.id,
                SetRowHiddenMutation.id,
                SetRowVisibleMutation.id].includes(command.id)
            ) {
                const ranges = (command.params as { ranges: IRange[] }).ranges;
                if (ranges.some(range => this.checkInRange(range))) {
                    this._change$.next();
                    console.log('chart-source trigger update');
                }
                return;
            }
        });

        this.watchRange();

        this._change$.pipe(debounceTime(750)).subscribe(() => {
            console.log('chart-source updated');
            this._reCalc();
        });
    }

    private checkInRange(range: IRange) {
        if(!this.dataRange) { return false; }
        const check = (source: IChartRange) => {
            if (source.rangeType === RANGE_TYPE.ALL) { return true; };
            if (source.rangeType === RANGE_TYPE.COLUMN) {
                return range.startColumn <= source.endColumn && range.endColumn >= source.startColumn;
            }
            if (source.rangeType === RANGE_TYPE.ROW) {
                return range.startRow <= source.endRow && range.endRow >= source.startRow;
            }
    
            return range.startColumn <= source.endColumn && range.endColumn >= source.startColumn && range.startRow <= source.endRow && range.endRow >= source.startRow;
        }
        for(const source of this.dataRange) {
            if(check(source)) { return true; }
        }
        
        return false;
    }

    private watchRangeDisposable: DisposableCollection;

    private watchRange() {
        this.watchRangeDisposable?.dispose();
        if (!this.dataRange) { return; }
        this.watchRangeDisposable = new DisposableCollection();
        const onChange = () => {
            this._change$.next();
            return { undos: [], redos: [] }
        }
        this.dataRange.map(range => this.watchRangeDisposable.add(this._refRangeService.registerRefRange(range, onChange, this.unitId, this.subUnitId)));
        this.disposeWithMe(this.watchRangeDisposable);
    }

    private checkSameDataRange(range1: IChartRange[], range2: IChartRange[]) {
        if(!range1 && !range2) { return true; }
        if(range1?.length !== range2?.length) { return false; }
        let _range2: Nullable<IChartRange>[] = range2.slice();
        for(const r1 of range1) {
            const index = _range2.findIndex(r2 => this.checkSameRange(r1, r2));
            if(index === -1) { return false; }
            _range2.splice(index, 1);
        }
        return true;
    }

    private checkSameRange(range1: IChartRange, range2: Nullable<IChartRange>) {
        if(!range1 || !range2) { return false; }
        const checkSameRowOrCol = (a: number, b: number) => {
            if(Number.isNaN(a) && Number.isNaN(b)) { return true; }
            return a === b;
        }
        return range1.rangeType === range2.rangeType &&
            checkSameRowOrCol(range1.startRow, range2.startRow) &&
            checkSameRowOrCol(range1.endRow, range2.endRow) &&
            checkSameRowOrCol(range1.startColumn, range2.startColumn) &&
            checkSameRowOrCol(range1.endColumn, range2.endColumn)
    }

    setRange(range: IChartDataSourceRange) {
        const nextRange = Array.isArray(range) ? range : range ? [range] : [];
        
        if(this.checkSameDataRange(nextRange, this.dataRange)) { return; }

        this.dataRange = nextRange;
        this.watchRange();
        
        this._reCalc();
    }

    getRange() {
        return this.dataRange;
    }

    private _reCalc() {
        setTimeout(() => {
            const dataset = this.convertDataset();
            this._data$.next(dataset);
        }, 100);
    }

    private checkSourceItem(item: { [key: string]: any }) {
        return Boolean(item && Object.values(item).find(v => v !== '-'));
    }

    convertDataset(): IChartDataset {
        return this._converDataset();
    }

    private _converDataset() {
        const dataset: IChartDataset = { dimensions: [], source: [] };
        if (!this.dataRange) { return dataset; }
        const target = getSheetCommandTarget(this._univerInstanceService, { unitId: this.unitId, subUnitId: this.subUnitId });
        if (!target) { return dataset; }
        const wholeRange: IChartDataRange = { startRow: null, endRow: null, ranges: this.dataRange };
        let currentRange = this.getNextRange(wholeRange, null);
        while (currentRange) {
            const result = this.convertDatasetWithRange(target.worksheet, currentRange, dataset);
            currentRange = result ? this.getNextRange(wholeRange, currentRange) : null;
            console.log('_converDataset', this.dataRange, currentRange);
        }
        return dataset;
    }

    private getNextRange(wholeRange: IChartDataRange, currentRange: Nullable<IChartDataRange>): Nullable<IChartDataRange> {
        if(!wholeRange.ranges || !wholeRange.ranges.length) { return null; }
        if(wholeRange.startRow === null) {
            wholeRange.ranges.map(range => {
                let startRow = wholeRange.startRow || range.startRow;
                if(startRow > range.startRow) {
                    startRow = range.startRow;
                }
                let endRow = wholeRange.endRow || range.endRow;
                if(endRow < range.endRow) {
                    endRow = range.endRow;
                }
                wholeRange.startRow = startRow;
                wholeRange.endRow = endRow;
            });
        }

        if(currentRange?.endRow! >= wholeRange.endRow!) { return null; }
        const { startRow, endRow } = wholeRange;
        const cRange: IChartDataRange = Object.assign({}, currentRange || { startRow: startRow, endRow: -1, ranges: null });
        cRange.startRow = cRange.endRow! + 1;
        cRange.endRow = Math.min(cRange.startRow + 100, endRow!);

        cRange.ranges = wholeRange.ranges.flatMap(range => {
            if(cRange.startRow! > range.endRow || cRange.endRow! < range.startRow) { return []; }
            return [{ startColumn: range.startColumn, endColumn: range.endColumn, startRow: Math.max(cRange.startRow!, range.startRow), endRow: Math.min(cRange.endRow!, range.endRow) }];
        }).sort((a, b) => (a.startColumn + a.endColumn) - (b.startColumn + b.endColumn));

        if(!cRange.ranges.length) {
            return this.getNextRange(wholeRange, cRange);
        }
        return cRange;
    }

    private weekmap = new WeakMap();

    private convertDatasetWithRange(worksheet: Worksheet, range: IChartDataRange, dataset: IChartDataset) {
        const sheetData = range.ranges?.flatMap((range) => {
            const values = worksheet?.getRange(range).getValues();
            if(!values) { return []; }
            return [{ values, range }]
        });
        if(!sheetData?.length) { return false; }

        const getCellDisplayValue = (cell: Nullable<ICellData>) => {
            if (cell?.p && cell.p.body?.dataStream) {
                return cell.p.body.dataStream;
            } else if (cell?.v) {
                return String(cell.v);
            } else {
                return ''
            }
        }

        const dirtyDimensions = this.weekmap.get(dataset) || [];
        this.weekmap.set(dataset, dirtyDimensions);

        for(let rowIndex = range.startRow!; rowIndex <= range.endRow!; rowIndex++) {
            if(!worksheet.getRowVisible(rowIndex)) { continue; }
            const isTrySetDimension = !dataset.dimensions?.length;
            const value: any = {};
            sheetData.map(data => {
                const { values, range } = data;
                const cols = values[rowIndex - range.startRow];
                if(!cols) { return; }
                for(let colIndex = range.startColumn; colIndex <= range.endColumn; colIndex++) {
                    if(!worksheet.getColVisible(colIndex)) { continue; }
                    const cell = cols[colIndex - range.startColumn];
                    if(isTrySetDimension) {
                        const cellValue = `${getCellDisplayValue(cell) || ''}` || `类目 ${dataset.dimensions!.length + 1}`;
                        dataset.dimensions!.push(cellValue);
                        dirtyDimensions[colIndex] = cellValue;
                        continue;
                    }
                    value[dirtyDimensions[colIndex]] = isNullCell(cell) ? '-' : getCellDisplayValue(cell);
                }
            });
            if(isTrySetDimension) { continue; }
            if(!this.checkSourceItem(value)) { return false; }
            (dataset.source as any[]).push(value);
        }

        return true;
    }

    override dispose(): void {
        super.dispose();

        this._change$.complete();
        this._data$.complete();
    }
}

export function createChartDataSource(unitId: string, subUnitId: string, range: IChartDataSourceRange, injector: Injector) {
    return injector.createInstance(ChartDataSource, unitId, subUnitId, range);
}