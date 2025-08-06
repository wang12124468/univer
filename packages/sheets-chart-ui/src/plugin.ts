import { Dependency, IConfigService, Inject, Injector, merge, Plugin, UniverInstanceType } from "@univerjs/core";
import { defaultPluginConfig, IUniverSheetsChartUIConfig, SHEETS_CHART_UI_PLUGIN_CONFIG_KEY } from "./controllers/config.schema";
import { SheetsChartUIController } from "./controllers/sheets-chart-ui.controller";
import { SheetsChartUIService } from "./services/sheets-chart-ui.service";
import { SheetsChartBlueprintService } from "./services/sheets-chart-blueprint.service";


const NAME = 'SHEET_CHART_UI_PLUGIN';

export class UniverSheetsChartUIPlugin extends Plugin {
    static override type = UniverInstanceType.UNIVER_SHEET;
    static override pluginName = NAME;

    constructor(
        private readonly _config: Partial<IUniverSheetsChartUIConfig> = defaultPluginConfig,
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
        this._configService.setConfig(SHEETS_CHART_UI_PLUGIN_CONFIG_KEY, rest);
    }

    override onStarting(): void {
        ([
            [SheetsChartUIController],
            [SheetsChartUIService],
            [SheetsChartBlueprintService]
        ] as Dependency[]).forEach(d => this._injector.add(d));
    }

    override onReady(): void {
        this._injector.get(SheetsChartUIController);
        this._injector.get(SheetsChartUIService);
        this._injector.get(SheetsChartUIService);
    }

}