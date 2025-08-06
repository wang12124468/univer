import { createContext, useContext } from "react";
import { ChartRenderModel } from "../../../../services/chart-render";
import { IChartDataset, IChartSnapshot } from "@univerjs/sheets-chart";
import { IBlueprint } from "../../../../blueprint/interface";
import { Nullable } from "@univerjs/core";

export interface IContext {
    getComponent: (id: string) => any;
    unitId: string;
    subUnitId: string;
    chartId: string;
    model: ChartRenderModel;
    snapshot: IChartSnapshot;
    dataset: IChartDataset;
    blueprint: IBlueprint
}

export const Context = createContext<Nullable<IContext>>(null);