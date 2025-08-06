import { CommandType, ICommandService, IMutation } from '@univerjs/core';
import { ISheetCommandSharedParams } from '@univerjs/sheets';
import { IChartSnapshot } from '../../services/interface';
import { ChartUpdateSourceMutation } from './sheets-chart-update-source.mutation';
import { ChartUpdateConfigMutation } from './sheets-chart-update-config.mutation';
import { SheetsChartService } from '../../services/sheets-chart.service';


export interface IInsertSheetsChartMutationParams extends IChartSnapshot, ISheetCommandSharedParams {
    chartId: string;
}

export const InsertSheetsChartMutation: IMutation<IInsertSheetsChartMutationParams> = {
    id: 'sheet.mutation.chart-insert',
    type: CommandType.MUTATION,
    handler(accessor, params) {
        const { unitId, subUnitId, ...snapshot } = params;

        const command = accessor.get(ICommandService);

        command.executeCommand(ChartUpdateConfigMutation.id, { unitId, subUnitId, ...snapshot });
        command.executeCommand(ChartUpdateSourceMutation.id, { unitId, subUnitId, ...snapshot });

        return true;
    },
}

export interface IRemoveSheetsChartMutationParams extends ISheetCommandSharedParams {
    chartId: string;
}
export const RemoveSheetsChartMutation: IMutation<IRemoveSheetsChartMutationParams> = {
    id: 'sheet.mutation.chart-remove',
    type: CommandType.MUTATION,
    handler(accessor, params) {
        const { unitId, subUnitId, chartId } = params;
        
        const sheetsChartService = accessor.get(SheetsChartService);
        const chartModel = sheetsChartService.getChartModel(unitId, subUnitId);
        if(!chartModel) { return true; }
        chartModel.setChartSnapshot(chartId);
        return true;
    },
}

export interface IUpdateSheetsChartMutationParams extends ISheetCommandSharedParams, IChartSnapshot {
    chartId: string;
}
export const UpdateSheetsChartMutation: IMutation<IUpdateSheetsChartMutationParams> = {
    id: 'sheet.mutation.chart-update',
    type: CommandType.MUTATION,
    handler(accessor, params) {
        const { unitId, subUnitId, chartId, ...snapshot } = params;
        
        const sheetsChartService = accessor.get(SheetsChartService);
        const chartModel = sheetsChartService.getChartModel(unitId, subUnitId);
        if(!chartModel) { return true; }
        chartModel.updateChartSnapshot(chartId, snapshot);
        return true;
    },
}