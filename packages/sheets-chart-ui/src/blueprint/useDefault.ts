import { SheetsChartBlueprintService } from "../services/sheets-chart-blueprint.service";
import * as blueprints from './index';

export function register(service: SheetsChartBlueprintService) {
    Object.entries(blueprints).map(([name, blueprint]) => service.registerBlueprint(blueprint));
}