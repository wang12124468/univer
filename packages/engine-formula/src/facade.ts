/**
 * Copyright 2023-present DreamNum Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { FBase, FUniver, ICommandService, Inject, Injector } from '@univerjs/core';
import type { ICommandInfo, IDisposable } from '@univerjs/core';
import { SetFormulaCalculationNotificationMutation, SetFormulaCalculationStartMutation, SetFormulaCalculationStopMutation } from './commands/mutations/set-formula-calculation.mutation';
import type { ISetFormulaCalculationNotificationMutation, ISetFormulaCalculationStartMutation } from './commands/mutations/set-formula-calculation.mutation';
import type { FormulaExecutedStateType, IExecutionInProgressParams } from './services/runtime.service';

/**
 * This interface class provides methods to modify the behavior of the operation formula.
 */
export class FFormula extends FBase {
    constructor(@Inject(Injector) protected readonly _injector: Injector) {
        super();
    }

    /**
     * Start the calculation of the formula.
     */
    executeCalculation(): void {
        const commandService = this._injector.get(ICommandService);
        commandService.executeCommand(
            SetFormulaCalculationStartMutation.id,
            {
                commands: [],
                forceCalculation: true,
            },
            {
                onlyLocal: true,
            }
        );
    }

    /**
     * Stop the calculation of the formula.
     */
    stopCalculation(): void {
        const commandService = this._injector.get(ICommandService);
        commandService.executeCommand(SetFormulaCalculationStopMutation.id, {});
    }

    /**
     * Listening calculation starts.
     */
    calculationStart(callback: (forceCalculation: boolean) => void): IDisposable {
        const commandService = this._injector.get(ICommandService);
        return commandService.onCommandExecuted((command: ICommandInfo) => {
            if (command.id === SetFormulaCalculationStartMutation.id) {
                const params = command.params as ISetFormulaCalculationStartMutation;
                callback(params.forceCalculation);
            }
        });
    }

    /**
     * Listening calculation ends.
     */
    calculationEnd(callback: (functionsExecutedState: FormulaExecutedStateType) => void): IDisposable {
        const commandService = this._injector.get(ICommandService);
        return commandService.onCommandExecuted((command: ICommandInfo) => {
            if (command.id !== SetFormulaCalculationNotificationMutation.id) {
                return;
            }

            const params = command.params as ISetFormulaCalculationNotificationMutation;

            if (params.functionsExecutedState !== undefined) {
                callback(params.functionsExecutedState);
            }
        });
    }

    /**
     * Listening calculation processing.
     */
    calculationProcessing(callback: (stageInfo: IExecutionInProgressParams) => void): IDisposable {
        const commandService = this._injector.get(ICommandService);
        return commandService.onCommandExecuted((command: ICommandInfo) => {
            if (command.id !== SetFormulaCalculationNotificationMutation.id) {
                return;
            }

            const params = command.params as ISetFormulaCalculationNotificationMutation;

            if (params.stageInfo !== undefined) {
                callback(params.stageInfo);
            }
        });
    }
}

class FacadeFormula {
    protected readonly _injector: Injector;

    getFormula(): FFormula {
        return this._injector.createInstance(FFormula);
    }
}

FUniver.extend(FacadeFormula);
