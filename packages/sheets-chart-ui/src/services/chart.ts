import { Disposable, toDisposable } from "@univerjs/core";
import * as echarts from "echarts";
import { ChartRenderModel } from "./chart-render";
import { IChartOption } from "@univerjs/sheets-chart";

export interface IChartSetOptionOpts extends echarts.SetOptionOpts {

}

export class Chart extends Disposable {
    private element: HTMLElement;
    private chart: echarts.ECharts;
    private box = { width: 0, height: 0 };

    constructor(public model: ChartRenderModel) {
        super();
    }

    create(element: HTMLElement) {
        this.element = element;
        this.chart = echarts.init(element);
        this.setOption(this.getDefaultOption()!)
        
        const observer = new window.ResizeObserver(() => {
            const { clientWidth: width, clientHeight: height } = this.element;
            if(this.box.width === width && this.box.height === height) { return; }
            this.box = { width, height };
            this.chart.resize();
        });
        observer.observe(element);
        this.disposeWithMe(toDisposable(() => {
            observer.disconnect();
            this.element = null as any;
            this.chart.dispose();
            this.chart = null as any;
        }));
    }

    clear() {
        this.chart.clear();
    }

    setOption(option: IChartOption, opts?: IChartSetOptionOpts) {
        console.log('setOption', option, opts);
        this.chart?.setOption(option, opts)
    }

    private getDefaultOption() {
        return this.model.option;
    }
}