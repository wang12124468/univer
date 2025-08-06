import { CommandType, IMutation } from '@univerjs/core';
import { SheetsChartService } from '../../services/sheets-chart.service';
import { IChartSnapshot } from '../../services/interface';
import { ISheetCommandSharedParams } from '@univerjs/sheets';

export interface IChartUpdateSourceMutationParams extends Pick<IChartSnapshot, 'range' | 'chartId'>, ISheetCommandSharedParams {
    chartId: string;
}

export const ChartUpdateSourceMutation: IMutation<IChartUpdateSourceMutationParams> = {
    id: 'sheet.mutation.chart-update-source',
    type: CommandType.MUTATION,
    handler(accessor, params) {
        let { unitId, subUnitId, chartId, range } = params || {};
        const sheetsChartService = accessor.get(SheetsChartService);
        const chartModel = sheetsChartService.getOrCreateChartModel(unitId!, subUnitId!);
        chartModel.updateChartSnapshot(chartId, { range });
        return true;
    },
}