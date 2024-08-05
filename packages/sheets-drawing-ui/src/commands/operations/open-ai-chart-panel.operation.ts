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

import type { IOperation } from '@univerjs/core';
import { CommandType, LocaleService } from '@univerjs/core';
import { IDialogService } from '@univerjs/ui';

const SHEET_AI_CHART_DIALOG_ID = 'SHEET_AI_CHART_DIALOG';

const PANEL_WIDTH = 350;

export const OpenAIchartDialogOperation: IOperation = {
    id: 'ui.operation.open-ai-chart-dialog',
    type: CommandType.OPERATION,
    handler: (accessor) => {
        const dialogService = accessor.get(IDialogService);
        const localeService = accessor.get(LocaleService);

        dialogService.open({
            id: SHEET_AI_CHART_DIALOG_ID,
            draggable: true,
            width: PANEL_WIDTH,
            title: { title: localeService.t('find-replace.dialog.title') },
            children: { label: 'FindReplaceDialog' },
            destroyOnClose: true,
            style: { margin: '0', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
            onClose: () => dialogService.close(SHEET_AI_CHART_DIALOG_ID),
        });

        return true;
    },
};
