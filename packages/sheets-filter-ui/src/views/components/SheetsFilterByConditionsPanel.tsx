/**
 * Copyright 2023-present DreamNum Co., Ltd.
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

import type { ISelectProps } from '@univerjs/design';
import type { FilterOperator, IFilterConditionFormParams, IFilterConditionItem } from '../../models/conditions';
import type { ByConditionsModel } from '../../services/sheets-filter-panel.service';
import { LocaleService, Nullable } from '@univerjs/core';
import { borderClassName, clsx, Input, Radio, RadioGroup, Select } from '@univerjs/design';

import { ComponentManager, useDependency, useObservable } from '@univerjs/ui';
import React, { useCallback, useMemo } from 'react';
import { FilterConditionItems } from '../../models/conditions';

/**
 * Filter by conditions.
 */
export function FilterByCondition(props: { model: ByConditionsModel }) {
    const { model } = props;

    const localeService = useDependency(LocaleService);

    const componentManager = useDependency(ComponentManager);

    // form state is from the model
    const condition = useObservable(model.conditionItem$, undefined);
    const formParams = useObservable(model.filterConditionFormParams$, undefined);

    const radioValue = formParams?.and ? 'AND' : 'OR';
    const onRadioChange = useCallback((key: string | number | boolean) => {
        model.onConditionFormChange({ and: key === 'AND' });
    }, [model]);

    const { initConditionItem, initFilterConditionFormParams } = model;
    const initCondition = React.useMemo(() => ({ conditionItem: initConditionItem, conditionParams: initFilterConditionFormParams  }), [initConditionItem, initFilterConditionFormParams])

    const primaryOptions = usePrimaryOptions(localeService, initCondition);
    const onPrimaryConditionChange = useCallback((value: string, item: any) => {
        const _ = item?.conditionValue || value;
        const [primary, params] = _.split('@');
        model.onPrimaryConditionChange(primary as FilterOperator);
        if(params) {
            const newParams = FilterConditionItems.tryParseJSON(params);
            if(!newParams || params === newParams) { return; }
            model.onConditionFormChange(newParams);
        }
    }, [model]);

    const onFormParamsChange = useCallback((diffParams: Partial<IFilterConditionFormParams>) => {
        model.onConditionFormChange(diffParams);
    }, [model]);

    const placeholder = localeService.t('sheets-filter.panel.input-values-placeholder');

    return (
        <div
            data-u-comp="sheets-filter-panel-conditions-container"
            className="univer-flex univer-h-full univer-flex-col"
        >
            {/* primary condition */}
            {(condition && formParams) && (
                <>
                    <Select value={condition.operator} options={primaryOptions} onChange={onPrimaryConditionChange} />
                    {FilterConditionItems.getItemByOperator(condition.operator).numOfParameters !== 0
                        ? (
                            <div
                                data-u-comp="sheets-filter-panel-conditions-container-inner"
                                className={clsx(`
                                  univer-mt-2 univer-flex-grow univer-overflow-hidden univer-rounded-md univer-p-2
                                `, borderClassName)}
                            >
                                <FilterByConditionContent
                                    condition={condition}
                                    model={model}
                                    localeService={localeService}
                                    formParams={formParams}
                                    radioValue={radioValue}
                                    onFormParamsChange={onFormParamsChange}
                                    onRadioChange={onRadioChange}
                                    placeholder={placeholder}
                                    componentManager={componentManager}
                                />
                                <div
                                    data-u-comp="sheets-filter-panel-conditions-desc"
                                    className="univer-mt-2 univer-text-xs univer-text-gray-500"
                                >
                                    {localeService.t('sheets-filter.panel.?')}
                                    <br />
                                    {localeService.t('sheets-filter.panel.*')}
                                </div>
                            </div>
                        )
                        : null}
                </>
            )}
        </div>
    );
}

// eslint-disable-next-line ts/no-explicit-any
function FilterByConditionContent(props: any) {
    const { condition, localeService, formParams, ...rest } = props;
    const options = useSecondaryOptions(condition.operator, localeService);
    const scProps = {
        ...rest,
        localeService,
        secondaryOptions: options,
    };
    return (
        <React.Fragment>
            { condition.numOfParameters >= 1 && <SecondaryCondition {...scProps} operator={formParams.operator1} val={formParams.val1} name="operator1" /> }
            { condition.numOfParameters >= 2 && <SecondaryCondition {...scProps} operator={formParams.operator2} val={formParams.val2} name="operator2" /> }
        </React.Fragment>
    );
}

// eslint-disable-next-line ts/no-explicit-any
function SecondaryCondition(props: any) {
    const { radioValue, operator, name, model, secondaryOptions, onFormParamsChange, val, placeholder, onRadioChange, componentManager } = props;
    const condition = FilterConditionItems.getItemByOperator(operator);
    const shouldRenderInput = condition.numOfParameters === 1;
    return (
        <>
            {name === 'operator2' && (
                <RadioGroup className='univer-sheet-filter-condition-radio-group' value={radioValue} onChange={onRadioChange}>
                    <Radio value="AND">并且</Radio>
                    <Radio value="OR">或者</Radio>
                </RadioGroup>
            )}
            {
                secondaryOptions.length > 1 && (
                    <Select
                        className='univer-sheet-filter-secondard-condition'
                        value={operator}
                        options={secondaryOptions}
                        onChange={(operator) => onFormParamsChange({ [name]: operator as FilterOperator })}
                    />
                )
            }
            {shouldRenderInput && (
                <div className='univer-sheet-filter-secondard-input'>
                    <ConditionInput
                        condition={condition}
                        model={model}
                        value={val}
                        placeholder={placeholder}
                        onChange={(value: any) => onFormParamsChange({ [name === 'operator1' ? 'val1' : 'val2']: value })}
                        componentManager={componentManager}
                    />
                </div>
            )}
        </>
    );
}

function ConditionInput(props: { condition: IFilterConditionItem, value: any, placeholder: any, onChange: any, componentManager: ComponentManager, model: any }) {
    const { condition, value, placeholder, onChange, componentManager, model } = props;
    const Component = condition.componentId && componentManager.get(condition.componentId);
    if(Component) {
        return (
            <Component
                model={model}
                condition={condition}
                className="univer-mt-2"
                value={value}
                placeholder={placeholder}
                onChange={onChange}
            />
        );
    }

    return (
        <Input
            className="univer-mt-2"
            value={value}
            placeholder={placeholder}
            onChange={onChange}
        />
    );
}

function usePrimaryOptions(localeService: LocaleService, condition: { conditionItem: Nullable<IFilterConditionItem>, conditionParams: Nullable<IFilterConditionFormParams> }): ISelectProps['options'] {
    const locale = localeService.getCurrentLocale();

    return useMemo(() => {
        const options = [
            {
                options: [
                    { label: localeService.t(FilterConditionItems.NONE.label), value: FilterConditionItems.NONE.operator },
                ],
            },
            {
                options: [
                    { label: localeService.t(FilterConditionItems.EMPTY.label), value: FilterConditionItems.EMPTY.operator },
                    { label: localeService.t(FilterConditionItems.NOT_EMPTY.label), value: FilterConditionItems.NOT_EMPTY.operator },
                ],
            },
            {
                options: [
                    { label: localeService.t(FilterConditionItems.TEXT_CONTAINS.label), value: FilterConditionItems.TEXT_CONTAINS.operator },
                    { label: localeService.t(FilterConditionItems.DOES_NOT_CONTAIN.label), value: FilterConditionItems.DOES_NOT_CONTAIN.operator },
                    { label: localeService.t(FilterConditionItems.STARTS_WITH.label), value: FilterConditionItems.STARTS_WITH.operator },
                    { label: localeService.t(FilterConditionItems.ENDS_WITH.label), value: FilterConditionItems.ENDS_WITH.operator },
                    { label: localeService.t(FilterConditionItems.EQUALS.label), value: FilterConditionItems.EQUALS.operator },
                ],
            },
            {
                options: [
                    { label: localeService.t(FilterConditionItems.GREATER_THAN.label), value: FilterConditionItems.GREATER_THAN.operator },
                    { label: localeService.t(FilterConditionItems.GREATER_THAN_OR_EQUAL.label), value: FilterConditionItems.GREATER_THAN_OR_EQUAL.operator },
                    { label: localeService.t(FilterConditionItems.LESS_THAN.label), value: FilterConditionItems.LESS_THAN.operator },
                    { label: localeService.t(FilterConditionItems.LESS_THAN_OR_EQUAL.label), value: FilterConditionItems.LESS_THAN_OR_EQUAL.operator },
                    { label: localeService.t(FilterConditionItems.EQUAL.label), value: FilterConditionItems.EQUAL.operator },
                    { label: localeService.t(FilterConditionItems.NOT_EQUAL.label), value: FilterConditionItems.NOT_EQUAL.operator },
                    { label: localeService.t(FilterConditionItems.BETWEEN.label), value: FilterConditionItems.BETWEEN.operator },
                    { label: localeService.t(FilterConditionItems.NOT_BETWEEN.label), value: FilterConditionItems.NOT_BETWEEN.operator },
                ],
            },
            {
                options: [
                    { label: localeService.t(FilterConditionItems.CUSTOM.label), value: FilterConditionItems.CUSTOM.operator },
                ],
            },
        ] as ISelectProps['options'];
        return FilterConditionItems.getPrimaryOptions(options, condition)
    }, [locale, localeService, condition]);
}

// eslint-disable-next-line ts/no-explicit-any
function useSecondaryOptions(operator: any, localeService: LocaleService): ISelectProps['options'] {
    const locale = localeService.getCurrentLocale();

    return useMemo(() => FilterConditionItems.getSecondaryOptions(operator)
        .map((c) => ({ label: localeService.t(c.label), value: c.operator })) as ISelectProps['options'], [operator, locale, localeService]);
}
