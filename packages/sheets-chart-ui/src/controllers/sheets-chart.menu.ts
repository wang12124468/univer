import { IAccessor, UniverInstanceType } from "@univerjs/core";
import { getMenuHiddenObservable, IMenuButtonItem, IMenuSelectorItem, MenuItemType } from "@univerjs/ui";
import { getCurrentRangeDisable$, getObservableWithExclusiveRange$ } from "@univerjs/sheets-ui";
import { RangeProtectionPermissionViewPoint, WorksheetFilterPermission, WorksheetViewPermission } from "@univerjs/sheets";
import { InsertBarChartCommand, InsertLinerChartCommand, InsertPieChartCommand, InsertRadarChartCommand, InsertScatterChartCommand, SmartInsertChartCommand } from "../commands/operations/sheets-chart.operation";


export function SmartInsertChartMenuItemFactory(accessor: IAccessor): IMenuSelectorItem {
    return {
        id: SmartInsertChartCommand.id,
        type: MenuItemType.BUTTON_SELECTOR,
        tooltip: '插入图表',
        icon: 'ChartIcon',
        hidden$: getMenuHiddenObservable(accessor, UniverInstanceType.UNIVER_SHEET),
        disabled$: getObservableWithExclusiveRange$(accessor, getCurrentRangeDisable$(accessor, { worksheetTypes: [WorksheetFilterPermission, WorksheetViewPermission], rangeTypes: [RangeProtectionPermissionViewPoint] })),
    };
}

export function InsertLinerChartMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: InsertLinerChartCommand.id,
        type: MenuItemType.BUTTON,
        title: '折线图',
        icon: 'LineChartIcon',
    };
}

export function InsertBarChartMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: InsertBarChartCommand.id,
        type: MenuItemType.BUTTON,
        title: '柱状图',
        icon: 'ColumnChartIcon',
    };
}
export function InsertPieChartMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: InsertPieChartCommand.id,
        type: MenuItemType.BUTTON,
        title: '饼图',
        icon: 'PieChartIcon',
    };
}
export function InsertRadarChartMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: InsertRadarChartCommand.id,
        type: MenuItemType.BUTTON,
        title: '雷达图',
        icon: 'RadarChartIcon',
    };
}
export function InsertScatterChartMenuItemFactory(accessor: IAccessor): IMenuButtonItem {
    return {
        id: InsertScatterChartCommand.id,
        type: MenuItemType.BUTTON,
        title: '散点图',
        icon: 'ScatterChartIcon',
    };
}

