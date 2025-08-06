import { connectInjector, IShortcutService, useDependency, useObservable } from "@univerjs/ui";
import { useCallback, useMemo, useRef, useState } from "react";
import { SheetsChartUIService } from "../../services/sheets-chart-ui.service";
import { SheetsChartBlueprintService } from "../../services/sheets-chart-blueprint.service";
import { getComponent as _getComponent } from "./widget";
import { IDisposable, Injector } from "@univerjs/core";
import { Context } from "./widget/context/Context";
import { Tools } from "./widget/common/tools";
import './widget/index';
import './style/index.less';

const prefixCls = Tools.getPrefixCls();
export function EditChart(props: any) {
    const { unitId, subUnitId, chartId } = props || {};

    return <EditChartCore key={`${unitId}-${subUnitId}-${chartId}`} {...props}/>;
}

function EditChartCore(props: any) {
    const { unitId, subUnitId, chartId } = props || {};

    const [tab, setTab] = useState('setting');
    const componentRef = useRef<{ [key: string]: any }>({});
    const forceEscape$ = useRef<IDisposable>(null);

    const shortcutService = useDependency(IShortcutService);

    const chartUIService = useDependency(SheetsChartUIService);
    const chartBlueprintService = useDependency(SheetsChartBlueprintService);
    const injector = useDependency(Injector);

    const model = useMemo(() => chartUIService.getChartRenderModel(unitId, subUnitId, chartId), [unitId, subUnitId, chartId, chartUIService])!;
    if(!model) { return null; }

    const snapshot = useObservable(model.snapshot.value$)!;
    const dataset = useObservable(model.dataSource?.data$)!;

    const blueprint = useMemo(() => chartBlueprintService.testBlueprint({ snapshot, dataset }), [snapshot, dataset, chartBlueprintService]);
    if(!blueprint) { return null; }

    const getComponent = useCallback((id: string) => {
        const bid = blueprint?.getComponentId ? blueprint.getComponentId(id) : id;
        if(componentRef.current[bid]) { return componentRef.current[bid]; }
        const Component = _getComponent(bid);
        if(Component) {
            componentRef.current[bid] = connectInjector(Component, injector);
            return componentRef.current[bid];
        }
        return (() => null) as any;
    }, [blueprint]);

    const TabContent = useMemo(() => getComponent(`tab-content-${tab}`), [tab, getComponent]);

    return (
        <Context.Provider value={{ getComponent, model, unitId, subUnitId, chartId, snapshot, dataset, blueprint }}>
            <div
                className={`${prefixCls}`} tabIndex={-1}
                onFocus={() => {
                    forceEscape$.current?.dispose();
                    forceEscape$.current = shortcutService.forceEscape(); 
                }}
                onBlur={() => {
                    forceEscape$.current?.dispose();
                    forceEscape$.current = null;
                }}>
                <div className={`${prefixCls}-body`}>
                    <div className={`${prefixCls}-tabs`}>
                        <div className={`${prefixCls}-tab ${tab === 'setting' ? 'active' : ''}`} onClick={() => setTab('setting')}>
                            设置
                        </div>
                        <div className={`${prefixCls}-tab ${tab === 'config' ? 'active' : ''}`} onClick={() => setTab('config')}>
                            样式
                        </div>
                    </div>
                    { TabContent && <TabContent /> }
                </div>
            </div>
        </Context.Provider>
    );
}

