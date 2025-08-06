import { Disposable, Nullable } from "@univerjs/core";
import { IChartDataset, IChartSnapshot } from "@univerjs/sheets-chart";
import { Subject } from "rxjs";
import { IBlueprint } from "../blueprint/interface";
import { register } from '../blueprint/useDefault';

export class SheetsChartBlueprintService extends Disposable {

    private _blueprints = new Map<string, IBlueprint>();
    private _changed$ = new Subject<void>();
    readonly changed$ = this._changed$.asObservable();

    constructor() {
        super();

        this._init();
    }

    private _init() {
        register(this);
    }

    testBlueprint(params: { snapshot: IChartSnapshot, dataset: IChartDataset }): Nullable<IBlueprint> {
        const blueprints = this.getAllBlueprints();
        for(const blueprint of blueprints) {
            if(blueprint.test?.(params)) {
                return blueprint;
            }
        }
        return null;
    }

    getBlueprint(id: string) {
        return this._blueprints.get(id);
    }

    registerBlueprint(blueprint: IBlueprint) {
        if(!blueprint) { return; }
        this._blueprints.set(blueprint.id, blueprint);
        this._changed$.next();
    }

    unregisterBlueprint(id: string) {
        this._blueprints.delete(id);
        this._changed$.next();
    }

    getAllBlueprints(isSort = true) {
        if(!isSort) { return Array.from(this._blueprints.values()); }
        return Array.from(this._blueprints.values()).sort((a, b) => a?.order! - b?.order!);
    }

}