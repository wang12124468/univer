import { useDependency } from "@univerjs/ui";
import { SheetsChartUIService } from "../../../../../services/sheets-chart-ui.service";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Tools } from "../../common/tools";
import { ISettingConfig } from "../../interface";
import { IChartDataset, IChartSnapshot } from "@univerjs/sheets-chart";

export function useSettingHook<T extends ISettingConfig>(unitId: string, subUnitId: string, snapshot: IChartSnapshot, dataset: IChartDataset) {
    const chartUIService = useDependency(SheetsChartUIService);
    const [temp, setTemp] = useState({} as T);

    const categories = useMemo(() => Tools.calcCategories(dataset!), [dataset]);

    const getDefaultSeriesIndexes = useCallback((dataset: IChartDataset, categoryIndex: number) => dataset.dimensions?.map((v, i) => i).filter(i => +i !== +categoryIndex), []);

    const settings: T = useMemo(() => {
        const subType = Tools.calcSubType(snapshot!);
        const refString = chartUIService.serializeRangeWithSheet({ unitId, sheetName: subUnitId, range: snapshot.range! });
        const categoryIndex = snapshot.context?.categoryIndex || 0;
        const seriesIndexes = snapshot.context?.seriesIndexes || getDefaultSeriesIndexes(dataset, categoryIndex);
        return Object.assign({}, { subType, refString, categoryIndex, seriesIndexes }, temp);
    }, [snapshot, dataset, temp]);

    const getNextSery = useCallback(() => {
        if(!settings.seriesIndexes || !dataset.dimensions) { return null; }
        if(settings.seriesIndexes.length === dataset.dimensions.length - 1) { return null; }
        const all = [...settings.seriesIndexes, settings.categoryIndex].map(i => i + '');
        const index = dataset.dimensions.findIndex((d, index) => !all.includes(index + ''));
        if(index !== -1) { return index; }
        
        return null;
    }, [settings, dataset]);

    const isFullSeries = useMemo(() => getNextSery() === null, [getNextSery]);
    
    return { settings, categories, temp, setTemp, isFullSeries, getNextSery, getDefaultSeriesIndexes }
}