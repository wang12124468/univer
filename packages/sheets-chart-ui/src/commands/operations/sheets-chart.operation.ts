import { CommandType, IAccessor, ICommand, ICommandService } from "@univerjs/core";
import { InsertChartCommand } from "../commands/sheets-chart.command";
import { ChartType } from "@univerjs/sheets-chart";

export const SmartInsertChartCommand: ICommand = {
    id: 'sheet.command.smart-insert-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        return commandService.syncExecuteCommand(InsertChartCommand.id);
    }
}

export const InsertLinerChartCommand: ICommand = {
    id: 'sheet.command.insert-liner-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        return commandService.syncExecuteCommand(InsertChartCommand.id, { chartType: ChartType.Liner });
    }
}

export const InsertBarChartCommand: ICommand = {
    id: 'sheet.command.insert-bar-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        return commandService.syncExecuteCommand(InsertChartCommand.id, { chartType: ChartType.Bar });
    }
}

export const InsertPieChartCommand: ICommand = {
    id: 'sheet.command.insert-pie-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        return commandService.syncExecuteCommand(InsertChartCommand.id, { chartType: ChartType.Pie });
    }
}

export const InsertRadarChartCommand: ICommand = {
    id: 'sheet.command.insert-radar-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        return commandService.syncExecuteCommand(InsertChartCommand.id, { chartType: ChartType.Radar });
    }
}

export const InsertScatterChartCommand: ICommand = {
    id: 'sheet.command.insert-scatter-chart',
    type: CommandType.COMMAND,
    handler: (accessor: IAccessor) => {
        const commandService = accessor.get(ICommandService);
        return commandService.syncExecuteCommand(InsertChartCommand.id, { chartType: ChartType.Scatter });
    }
}