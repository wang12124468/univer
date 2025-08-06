import { CommandType, ICommand, ICommandService, IUniverInstanceService } from '@univerjs/core';
import { IChartSnapshot } from '../../services/interface';
import { getSheetCommandTarget } from '@univerjs/sheets';
import { ChartUpdateSourceMutation } from '../mutations/sheets-chart-update-source.mutation';
export interface IChartUpdateSourceCommandParams extends Pick<IChartSnapshot, 'range' | 'chartId'> {
    unitId?: string;
    subUnitId?: string;
}

export const ChartUpdateSourceCommand: ICommand<IChartUpdateSourceCommandParams> = {
    id: 'sheet.command.chart-update-source',
    type: CommandType.COMMAND,
    handler(accessor, params, options) {
        let { unitId, subUnitId, chartId, range } = params || {};
        if (!chartId) { return true; }
        if (!unitId || !subUnitId) {
            const target = getSheetCommandTarget(accessor.get(IUniverInstanceService));
            if (!target) { return true; }
            unitId = target.unitId;
            subUnitId = target.subUnitId;
        }
        const command = accessor.get(ICommandService);
        command.syncExecuteCommand(ChartUpdateSourceMutation.id, { unitId, subUnitId, chartId, range });
        return true;
    },
}