import { createElement, useCallback, useContext, useEffect, useState } from "react";
import { Context } from "../../context/Context";
import { ComponentManager, useDependency } from "@univerjs/ui";
import { SheetsChartBlueprintService } from "../../../../../services/sheets-chart-blueprint.service";
import { ChartItem } from "../../common/chart-item";
import { Input, Select } from "@univerjs/design";
import { registerComponent } from "../../../widget";
import { Tools } from "../../common/tools";
import './style/index.less';
import { UpdateChartStrategy } from "../../../../../services/chart-render";

const prefixCls = Tools.getPrefixCls('edit-chart', 'tab-setting');

export function TabSetting() {
    const { blueprint, getComponent, snapshot, model } = useContext(Context)!;

    const [options, setOptions] = useState<any[]>([]);
    const chartBlueprintService = useDependency(SheetsChartBlueprintService);
    const componentManager = useDependency(ComponentManager);

    useEffect(() => {
        const update = () => setOptions(chartBlueprintService.getAllBlueprints()
            .map(b => {
                const Icon = componentManager.get(b.icon!);
                return {
                    label: <div style={{ display: "flex", alignItems: 'center' }}><div style={{ width: 24, paddingLeft: 6, display: "flex", alignItems: 'center' }}>{Icon && createElement(Icon)}</div>{b.label}</div>,
                    value: b.id
                }
            }));
        const $ = chartBlueprintService.changed$.subscribe(update);
        update();
        return () => { $.unsubscribe(); }
    }, [chartBlueprintService, componentManager]);

    const ChartSettingContent = getComponent!('chart-setting');
    
    const onApplyType = useCallback((id: string) => {
        const blueprint = chartBlueprintService.getBlueprint(id);
        const initSnapshot = blueprint?.getInitSnapshot?.();
        model.onApply({ chartType: blueprint?.type, context: undefined, option: undefined, ...initSnapshot }, UpdateChartStrategy.Rerender);
    }, [model]);

    return (
        <div className={`${prefixCls}`}>
            <ChartItem title="名称">
                <Input placeholder="请输入名称..." value={snapshot.chartName || ''} onChange={(e) => model.onApply({ ...snapshot, chartName: e }, UpdateChartStrategy.None)}/>
            </ChartItem>
            <ChartItem title="类型">
                <Select className="univer-w-full" value={blueprint.id} options={options} onChange={onApplyType}></Select>
            </ChartItem>
            { ChartSettingContent && <ChartSettingContent /> }
        </div>
    );
}

registerComponent('tab-content-setting', TabSetting);