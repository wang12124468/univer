import { CommandType, ICommand, ICommandService, IUniverInstanceService } from "@univerjs/core";
import type { IChartSnapshot } from "../../services/interface";
import { getSheetCommandTarget } from "@univerjs/sheets";
import { ChartUpdateConfigMutation } from "../mutations/sheets-chart-update-config.mutation";

export interface IChartUpdateSnapshotCommandParams extends Omit<IChartSnapshot, 'range'> {
    unitId?: string,
    subUnitId?: string,
}

export const ChartUpdateConfigCommand: ICommand<IChartUpdateSnapshotCommandParams> = {
    id: 'sheet.command.chart-update-config',
    type: CommandType.COMMAND,
    handler(accessor, params, options) {
        let { unitId, subUnitId, chartId, chartType, option, context } = params || {};
        if(!chartId) { return true; }
        if(!unitId || !subUnitId) {
            const target = getSheetCommandTarget(accessor.get(IUniverInstanceService));
            if(!target) { return true; }
            unitId = target.unitId;
            subUnitId = target.subUnitId;
        }
        
        const command = accessor.get(ICommandService);
        command.syncExecuteCommand(ChartUpdateConfigMutation.id, { unitId, subUnitId, chartId, chartType, option, context });

        return true;
    },
}