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

import { FUniver, ICommandService } from '@univerjs/core';
import type { Injector } from '@univerjs/core';
import { DisableCrosshairHighlightOperation, EnableCrosshairHighlightOperation, SetCrosshairHighlightColorOperation } from './commands/operations/operation';
import type { ISetCrosshairHighlightColorOperationParams } from './commands/operations/operation';

class FacadeSheetsCrosshairHighlight {
    protected readonly _injector: Injector;

    /**
     * Enable or disable crosshair highlight.
     * @param {boolean} enabled if crosshair highlight should be enabled
     */
    setCrosshairHighlightEnabled(enabled: boolean): void {
        const commandService = this._injector.get(ICommandService);
        if (enabled) {
            commandService.executeCommand(EnableCrosshairHighlightOperation.id);
        } else {
            commandService.executeCommand(DisableCrosshairHighlightOperation.id);
        }
    }

    /**
     * Set the color of the crosshair highlight.
     * @param {string} color the color of the crosshair highlight
     */
    setCrosshairHighlightColor(color: string): void {
        const commandService = this._injector.get(ICommandService);
        commandService.executeCommand(SetCrosshairHighlightColorOperation.id, {
            value: color,
        } as ISetCrosshairHighlightColorOperationParams);
    }
}

FUniver.extend(FacadeSheetsCrosshairHighlight);
