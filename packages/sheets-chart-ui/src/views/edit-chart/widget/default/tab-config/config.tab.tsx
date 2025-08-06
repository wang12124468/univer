import { Input, InputNumber } from "@univerjs/design";
import { ChartItem } from "../../common/chart-item";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ErrorService, isNumeric, merge } from "@univerjs/core";
import { Context } from "../../context/Context";
import { IChartSnapshot } from "@univerjs/sheets-chart";
import { registerComponent } from "../../../widget";
import { Tools } from "../../common/tools";
import './style/index.less';
import { useDependency } from "@univerjs/ui";

const prefixCls = Tools.getPrefixCls('edit-chart', 'tab-config');

export function ConfigTab() {
    const { blueprint } = useContext(Context)!;
    const error = useDependency(ErrorService);
    const check = (key: string, forceCheck = false) => {
        if(!forceCheck && blueprint.config === true) { return true; }
        return (blueprint?.config as any)?.[key];
    }
    
    return (
        <div className={`${prefixCls}`}>
            { check('grid') && <GridConfig /> }
            { check('xAxis') && <AxisConfig title="横坐标" type="xAxis" /> }
            { check('yAxis') && <AxisConfig title="纵坐标" type="yAxis" /> }
            { check('radar', true) && <RadarConfig error={error} /> }
            { check('pie', true) && <PieConfig error={error} /> }
        </div>
    );
}

registerComponent('tab-content-config', ConfigTab);

function GridConfig() {

    const { snapshot, model } = useContext(Context)!;

    const temp = useRef((() => {
        const { left, right, top, bottom } = (snapshot.option?.grid || {}) as echarts.GridComponentOption;
        return {
            left: { focus: false, value: left },
            right: { focus: false, value: right },
            top: { focus: false, value: top },
            bottom: { focus: false, value: bottom },
        };
    })());

    const onApplyGrid = useCallback(() => {
        const grid = {
            left: temp.current.left.value,
            right: temp.current.right.value,
            top: temp.current.top.value,
            bottom: temp.current.bottom.value,
        }
        model.onApplyWithOpts(merge({}, snapshot, { option: { grid } } as IChartSnapshot))
    }, [model]);

    const renderInputNumber = (type: 'left' | 'right' | 'top' | 'bottom') => {
        return (
            <InputNumber defaultValue={temp.current[type].value as any || null}
                onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                onFocus={() => temp.current[type].focus = true}
                onBlur={() => {
                    temp.current[type].focus = false;
                    if (isNumeric(temp.current[type].value as any)) {
                        onApplyGrid();
                    }
                }}
                onChange={e => {
                    temp.current[type].value = e!;
                    if (!temp.current[type].focus) {
                        onApplyGrid();
                    }
                }}
            />
        )
    }


    return (
        <ChartItem collapsable title="图表">
            <FromItem label="左侧距离">
                {renderInputNumber('left')}
            </FromItem>
            <FromItem label="右侧距离">
                {renderInputNumber('right')}
            </FromItem>
            <FromItem label="顶部距离">
                {renderInputNumber('top')}
            </FromItem>
            <FromItem label="底部距离">
                {renderInputNumber('bottom')}
            </FromItem>
        </ChartItem>
    );
}

function AxisConfig(props: { title: string; type: 'xAxis' | 'yAxis' }) {
    const { title, type } = props;
    const { snapshot, model } = useContext(Context)!;

    const temp = useRef((() => {
        const { axisLabel } = (snapshot.option?.[type] || {}) as echarts.XAXisComponentOption;
        return {
            width: { focus: false, value: axisLabel?.width || undefined },
            rotate: { focus: false, value: axisLabel?.rotate || '0' as any },
        };
    })());

    const onApplyAxis = useCallback(() => {
        const axis: echarts.XAXisComponentOption = {
            axisLabel: {
                width: temp.current.width.value || undefined,
                rotate: temp.current.rotate.value || 0
            }
        }
        model.onApplyWithOpts(merge({}, snapshot, { option: { [type]: axis } } as IChartSnapshot))
    }, [model]);

    const renderInputNumber = (type: 'width' | 'rotate', min: number, max: number) => {
        return (
            <InputNumber placeholder="无" min={min} max={max} defaultValue={temp.current[type].value as any}
                onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                onFocus={() => temp.current[type].focus = true}
                onBlur={() => {
                    temp.current[type].focus = false;
                    if (isNumeric(temp.current[type].value as any)) {
                        onApplyAxis();
                    }
                }}
                onChange={e => {
                    temp.current[type].value = e!;
                    if (!temp.current[type].focus) {
                        onApplyAxis();
                    }
                }}
            />
        )
    }
    
    return (
        <ChartItem collapsable title={title}>
            <FromItem label="标签角度">
                {renderInputNumber('rotate', -90, 90)}
            </FromItem>
            <FromItem label="标签宽度">
                {renderInputNumber('width', 20, 320)}
            </FromItem>
        </ChartItem>
    );
}

function RadarConfig(props: { error: ErrorService }) {
    const { error } = props;
    const { snapshot, model } = useContext(Context)!;
    

    const temp = useRef((() => {
        const { center = ['50%', '50%'], radius = '75%' } = (snapshot.option?.radar || {}) as echarts.RadarComponentOption;
        return {
            centerX: { focus: false, value: center?.[0], lastValue: '' },
            centerY: { focus: false, value: center?.[1], lastValue: '' },
            radius: { focus: false, value: radius, lastValue: '' },
        };
    })());

    const [radius, setRadius] = useState(temp.current.radius.value);
    const [centerX, setCenterX] = useState(temp.current.centerX.value);
    const [centerY, setCenterY] = useState(temp.current.centerY.value);

    const onApply = useCallback(() => {
        const radar: echarts.RadarComponentOption = {
            center: [temp.current.centerX.value, temp.current.centerY.value],
            radius: temp.current.radius.value
        }
        model.onApplyWithOpts(merge({}, snapshot, { option: { radar } } as IChartSnapshot))
    }, [model]);

    const renderInput = (type: 'centerX' | 'centerY' | 'radius', opts: { onChange?: any, onApply?: any, value?: any }) => {
        const { value, onChange, onApply } = opts;
        return (
            <Input
                value={value}
                // onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={e => e.code === 'Enter' && (e.target as HTMLInputElement).blur()}
                onFocus={() => {
                    temp.current[type].focus = true;
                    (temp.current[type] as any).lastValue = temp.current[type].value;
                }}
                onBlur={() => {
                    temp.current[type].focus = false;
                    const value: string = temp.current[type].value as any;
                    if(!/^-?\d+(\.\d+)?\%?$/.test(value)) {
                        error.emit(`${value} 格式错误，请输入数字或者百分比`);
                        temp.current[type].value = (temp.current[type] as any).lastValue;
                        onChange?.(temp.current[type].value);
                        return;
                    }
                    onApply?.();
                }}
                onChange={e => {
                    const value = e.trim();
                    onChange?.(value);
                    temp.current[type].value = value;
                }}
            />
        )
    }

    return (
        <ChartItem collapsable title="图表">
            <FromItem label="中心坐标">
                {renderInput('centerX', { value: centerX, onChange: setCenterX, onApply })}
                {renderInput('centerY', { value: centerY, onChange: setCenterY, onApply })}
            </FromItem>
            <FromItem label="半径">
                {renderInput('radius', { value: radius, onChange: setRadius, onApply })}
            </FromItem>
        </ChartItem>
    );
}

function PieConfig(props: { error: ErrorService }) {
    const { error } = props;
    const { snapshot, model } = useContext(Context)!;
    

    const temp = useRef((() => {
        const { center = ['50%', '50%'], radius = ['0', '75%'], left = '0', right = '0', top = '0', bottom = '0' } = ((snapshot.option?.series as any)?.[0] || snapshot.option?.series || {}) as any;
        return {
            centerX: { focus: false, value: center?.[0], lastValue: '' },
            centerY: { focus: false, value: center?.[1], lastValue: '' },
            radiusX: { focus: false, value: radius?.[0], lastValue: '' },
            radiusY: { focus: false, value: radius?.[1], lastValue: '' },
            left: { focus: false, value: left },
            right: { focus: false, value: right },
            top: { focus: false, value: top },
            bottom: { focus: false, value: bottom },
        };
    })());

    const [radiusX, setRadiusX] = useState(temp.current.radiusX.value);
    const [radiusY, setRadiusY] = useState(temp.current.radiusY.value);
    const [centerX, setCenterX] = useState(temp.current.centerX.value);
    const [centerY, setCenterY] = useState(temp.current.centerY.value);

    const onApply = useCallback(() => {
        const sery: echarts.PieSeriesOption = {
            center: [temp.current.centerX.value, temp.current.centerY.value],
            radius: [temp.current.radiusX.value, temp.current.radiusY.value],
            left: temp.current.left.value || 0,
            right: temp.current.right.value || 0,
            top: temp.current.top.value || 0,
            bottom: temp.current.bottom.value || 0,
        };
        const oldseries = Array.isArray(snapshot.option?.series) ? snapshot.option?.series : [snapshot.option?.series];
        const series = oldseries.map(_sery => ({ ..._sery, ...sery }));
        model.onApplyWithOpts(merge({}, snapshot, { option: { series } } as IChartSnapshot))
    }, [model]);

    const renderInput = (type: 'centerX' | 'centerY' | 'radiusX' | 'radiusY', opts: { onChange?: any, onApply?: any, value?: any }) => {
        const { value, onChange, onApply } = opts;
        return (
            <Input
                value={value}
                // onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                onKeyDown={e => e.code === 'Enter' && (e.target as HTMLInputElement).blur()}
                onFocus={() => {
                    temp.current[type].focus = true;
                    (temp.current[type] as any).lastValue = temp.current[type].value;
                }}
                onBlur={() => {
                    temp.current[type].focus = false;
                    const value: string = temp.current[type].value as any;
                    if(!/^-?\d+(\.\d+)?\%?$/.test(value)) {
                        error.emit(`${value} 格式错误，请输入数字或者百分比`);
                        temp.current[type].value = (temp.current[type] as any).lastValue;
                        onChange?.(temp.current[type].value);
                        return;
                    }
                    onApply?.();
                }}
                onChange={e => {
                    const value = e.trim();
                    onChange?.(value);
                    temp.current[type].value = value;
                }}
            />
        )
    }

    const renderInputNumber = (type: 'left' | 'right' | 'top' | 'bottom', opts: { onApply?: any }) => {
        const { onApply } = opts;
        return (
            <InputNumber defaultValue={temp.current[type].value as any || null}
                onPressEnter={(e) => (e.target as HTMLInputElement).blur()}
                onFocus={() => temp.current[type].focus = true}
                onBlur={() => {
                    temp.current[type].focus = false;
                    if (isNumeric(temp.current[type].value as any)) {
                        onApply?.();
                    }
                }}
                onChange={e => {
                    temp.current[type].value = e!;
                    if (!temp.current[type].focus) {
                        onApply?.();
                    }
                }}
            />
        )
    }

    return (
        <ChartItem collapsable title="图表">
            <FromItem label="左侧距离">
                {renderInputNumber('left', { onApply })}
            </FromItem>
            <FromItem label="右侧距离">
                {renderInputNumber('right', { onApply })}
            </FromItem>
            <FromItem label="顶部距离">
                {renderInputNumber('top', { onApply })}
            </FromItem>
            <FromItem label="底部距离">
                {renderInputNumber('bottom', { onApply })}
            </FromItem>
            <FromItem label="中心坐标">
                {renderInput('centerX', { value: centerX, onChange: setCenterX, onApply })}
                {renderInput('centerY', { value: centerY, onChange: setCenterY, onApply })}
            </FromItem>
            <FromItem label="半径">
                {renderInput('radiusX', { value: radiusX, onChange: setRadiusX, onApply })}
                {renderInput('radiusY', { value: radiusY, onChange: setRadiusY, onApply })}
            </FromItem>
        </ChartItem>
    );
}

function FromItem(props: { label?: string; children?: any, labelWidth?: number }) {
    const { label, children, labelWidth } = props;
    return (
        <div className={`${prefixCls}-form-item`}>
            <div className={`${prefixCls}-form-item-label`} style={{ width: labelWidth || 100 }}>{label}</div>
            <div className={`${prefixCls}-form-item-content`}>
                {children}
            </div>
        </div>
    );
}