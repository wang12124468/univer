import { CommandType, IMutation } from '@univerjs/core';
import { IChartSnapshot } from '../../services/interface';
import { SheetsChartService } from '../../services/sheets-chart.service';
import { ISheetCommandSharedParams } from '@univerjs/sheets';

export interface IChartUpdateSnapshotMutationParams extends Omit<IChartSnapshot, 'range'>, ISheetCommandSharedParams {
    chartId: string;
}

export const ChartUpdateConfigMutation: IMutation<IChartUpdateSnapshotMutationParams> = {
    id: 'sheet.mutation.chart-update-config',
    type: CommandType.MUTATION,
    handler(accessor, params) {
        let { unitId, subUnitId, chartId, chartType, option, context } = params || {};
    
        const sheetsChartService = accessor.get(SheetsChartService);
        const chartModel = sheetsChartService.getOrCreateChartModel(unitId, subUnitId);
        if(!chartModel.updateChartSnapshot(chartId, { chartType, option, context })) {
            chartModel.setChartSnapshot(chartId, { chartType, option, context });
        }

        return true;
    },
}

