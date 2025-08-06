import { CSSProperties, useCallback, useMemo, useState } from "react";
import { Tools } from "./tools";
import { DownIcon } from "@univerjs/icons";

const prefixCls = Tools.getPrefixCls('chart-item');

interface IChartItemProps {
    title?: string;
    children?: any;
    className?: string;
    style?: CSSProperties;
    actions?: any;
    collapsable?: boolean;
    visible?: boolean;
    defaultVisble?: boolean;
    onChange?: (visible: boolean) => void;
}

export function ChartItem(props: IChartItemProps) {
    const { title, children, className, style, actions, collapsable = false, visible: _visible, defaultVisble = true, onChange: _onChange } = props;
    const [visible, setVisible] = useState(defaultVisble);
    const mergeVisible = useMemo(() => {
        if(!collapsable) { return true; }
        return Reflect.has(props, 'visible') ? _visible : visible;
    }, [_visible, visible, collapsable]);

    const onChange = useCallback((visible: boolean) => {
        if(!collapsable) { return; }
        setVisible(visible);
        _onChange?.(visible);
    }, [collapsable, _onChange]);

    return (
        <div className={`${prefixCls} ${className} ${collapsable ? 'collapsable' : ''} ${mergeVisible ? 'visible' : ''}`} style={style}>
            { title && (
                <div className={`${prefixCls}-header`}>
                    <div className={`${prefixCls}-header-title`} onClick={() => onChange(!mergeVisible)}>
                        {<DownIcon className={`${prefixCls}-header-arrow`} />}
                        {title}
                    </div>
                    <div className={`${prefixCls}-header-actions`}>
                        {actions}
                    </div>
                </div>
            ) }

            { children && (
                <div className={`${prefixCls}-body`}>
                    {children}
                </div>
            ) }
        </div>
    );
}