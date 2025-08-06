import { CommandType, ErrorService, generateRandomId, IAccessor, ICommand, ICommandService, IUniverInstanceService } from "@univerjs/core";
import { getSheetCommandTarget, ISelectionWithStyle, SheetsSelectionsService } from "@univerjs/sheets";
import { SheetsChartUIService } from "../../services/sheets-chart-ui.service";
import { ChartType, IInsertSheetsChartMutationParams, InsertSheetsChartMutation, IRemoveSheetsChartMutationParams, RemoveSheetsChartMutation, IUpdateSheetsChartMutationParams, UpdateSheetsChartMutation, IChartSnapshot } from "@univerjs/sheets-chart";
import { SheetsChartBlueprintService } from "../../services/sheets-chart-blueprint.service";

export const InsertChartCommand: ICommand = {
    id: 'sheet.command.insert-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor, params: any) => {

        const commandService = accessor.get(ICommandService);
        const sheetsSelectionsService = accessor.get(SheetsSelectionsService);
        const chartBlueprintService = accessor.get(SheetsChartBlueprintService);
        const _univerInstanceService = accessor.get(IUniverInstanceService);
        const selections = sheetsSelectionsService.getCurrentSelections();
        if(isNullOrOnlyOneCellSelection(selections as any)) {
            const errorService = accessor.get(ErrorService);
            errorService.emit('选中的区域只有一单元格，无法进行图表插入')
            return false;
        }
        
        const { chartType = ChartType.Liner } = params || {};

        const { unitId, subUnitId } = getSheetCommandTarget(_univerInstanceService)! || {};
        console.log('InsertChartCommand', unitId, subUnitId);
        const blueprint = chartBlueprintService.getBlueprint(`${chartType}`);
        const defualtSnapshot: IChartSnapshot = {
            chartType: ChartType.Liner,
            option: {
                legend: {
                    type: 'scroll'
                },
                xAxis: {
                    type: 'category'
                },
                yAxis: {
                    type: 'value'
                },
                series: { type: 'line' }
            }
        }
        const snapshot = blueprint?.getInitSnapshot?.() || defualtSnapshot;

        const insertSheetsChartMutationParmas: IInsertSheetsChartMutationParams = {
            chartId: generateRandomId(),
            chartType: snapshot.chartType,
            unitId,
            subUnitId,
            range: selections.map(selection => selection.range),
            ...snapshot
        }

        commandService.executeCommand(InsertSheetsChartMutation.id, insertSheetsChartMutationParmas);
        return true;

    },
};

export const RemoveChartCommand: ICommand = {
    id: 'sheet.command.remove-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor, params: any) => {
        const { chartId, unitId: _unitId, subUnitId: _subUnitId } = params;
        const commandService = accessor.get(ICommandService);
        const _univerInstanceService = accessor.get(IUniverInstanceService);

        const { unitId, subUnitId } = getSheetCommandTarget(_univerInstanceService, { unitId: _unitId, subUnitId: _subUnitId })! || {};

        const removeSheetsChartMutationParams: IRemoveSheetsChartMutationParams = {
            chartId,
            unitId,
            subUnitId
        }

        commandService.executeCommand(RemoveSheetsChartMutation.id, removeSheetsChartMutationParams);
        return true;

    },
};

export const UpdateChartCommand: ICommand = {
    id: 'sheet.command.update-chart',
    type: CommandType.COMMAND,
    handler(accessor, params: any) {
        const { chartId, unitId: _unitId, subUnitId: _subUnitId, snapshot } = params;
        const commandService = accessor.get(ICommandService);
        const _univerInstanceService = accessor.get(IUniverInstanceService);

        const { unitId, subUnitId } = getSheetCommandTarget(_univerInstanceService, { unitId: _unitId, subUnitId: _subUnitId })! || {};

        const updateSheetsChartMutationParams: IUpdateSheetsChartMutationParams = {
            chartId,
            unitId,
            subUnitId,
            ...snapshot
        }

        commandService.executeCommand(UpdateSheetsChartMutation.id, updateSheetsChartMutationParams);
        return true;
    },
}

export const ToggleChartSettingVisibleCommand: ICommand = {
    id: 'sheet.command.toggle-chart-setting-visible',
    type: CommandType.COMMAND,
    handler(accessor, params: any) {
        const { unitId, subUnitId, chartId } = params;
        if(!unitId || !subUnitId || !chartId) { return false; }
        const chartUIService = accessor.get(SheetsChartUIService);
        chartUIService.toggleChartSettingPanel(unitId, subUnitId, chartId);
        return true;
    },
}

export const SetChartSettingVisibleCommand: ICommand = {
    id: 'sheet.command.set-chart-setting-visible',
    type: CommandType.COMMAND,
    handler(accessor, params: any) {
        const { unitId, subUnitId, chartId, visible = true } = params;
        const chartUIService = accessor.get(SheetsChartUIService);
        if(visible) {
            if(!unitId || !subUnitId || !chartId) { return false; }
            chartUIService.openChartSettingPanel(unitId, subUnitId, chartId);
            return true;
        }

        chartUIService.closeChartSettingPanel(unitId, subUnitId, chartId);
        return true;
    },
}

function isNullOrOnlyOneCellSelection(selections: ISelectionWithStyle[]) {
    if(!selections.length) { return true; }
    if(selections.length > 1) { return false; }
    const selection = selections[0];
    const { startColumn, endColumn, startRow, endRow } = selection.range;
    return startColumn === endColumn && startRow === endRow;
}