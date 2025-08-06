import { Dependency, IConfigService, Inject, Injector, merge, Plugin, UniverInstanceType } from "@univerjs/core";
import { defaultPluginConfig, IUniverSheetsChartConfig, SHEETS_CHART_PLUGIN_CONFIG_KEY } from "./controllers/config.schema";
import { SheetsChartController } from "./controllers/sheets-chart.controller";
import { SheetsChartService } from "./services/sheets-chart.service";


const NAME = 'SHEET_CHART_PLUGIN';

export class UniverSheetsChartPlugin extends Plugin {
    static override type = UniverInstanceType.UNIVER_SHEET;
    static override pluginName = NAME;

    constructor(
        private readonly _config: Partial<IUniverSheetsChartConfig> = defaultPluginConfig,
        @Inject(Injector) protected readonly _injector: Injector,
        @IConfigService private readonly _configService: IConfigService
    ) {
        super();

        // Manage the plugin configuration.
        const { ...rest } = merge(
            {},
            defaultPluginConfig,
            this._config
        );
        this._configService.setConfig(SHEETS_CHART_PLUGIN_CONFIG_KEY, rest);
    }

    override onStarting(): void {
        ([
            [SheetsChartController],
            [SheetsChartService],
        ] as Dependency[]).forEach(d => this._injector.add(d));
    }

    override onReady(): void {
        this._injector.get(SheetsChartController);
    }

}