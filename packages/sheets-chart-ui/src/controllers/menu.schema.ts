import { MenuSchemaType, RibbonStartGroup } from "@univerjs/ui";
import { InsertBarChartCommand, InsertLinerChartCommand, InsertPieChartCommand, InsertRadarChartCommand, InsertScatterChartCommand, SmartInsertChartCommand } from "../commands/operations/sheets-chart.operation";
import { InsertBarChartMenuItemFactory, InsertLinerChartMenuItemFactory, InsertPieChartMenuItemFactory, InsertRadarChartMenuItemFactory, InsertScatterChartMenuItemFactory, SmartInsertChartMenuItemFactory } from "./sheets-chart.menu";

export const menuSchema: MenuSchemaType = {
    [RibbonStartGroup.FORMULAS_INSERT]: {
        [SmartInsertChartCommand.id]: {
            order: 10,
            menuItemFactory: SmartInsertChartMenuItemFactory,
            [InsertLinerChartCommand.id]: {
                order: 0,
                menuItemFactory: InsertLinerChartMenuItemFactory
            },
            [InsertBarChartCommand.id]: {
                order: 0,
                menuItemFactory: InsertBarChartMenuItemFactory
            },
            [InsertPieChartCommand.id]: {
                order: 0,
                menuItemFactory: InsertPieChartMenuItemFactory
            },
            [InsertRadarChartCommand.id]: {
                order: 0,
                menuItemFactory: InsertRadarChartMenuItemFactory
            },
            [InsertScatterChartCommand.id]: {
                order: 0,
                menuItemFactory: InsertScatterChartMenuItemFactory
            }
        },
    },
}