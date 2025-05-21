/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PageableObject } from './PageableObject';
import type { SortObject } from './SortObject';
export type Page = {
    totalPages?: number;
    totalElements?: number;
    first?: boolean;
    last?: boolean;
    pageable?: PageableObject;
    size?: number;
    content?: Array<Record<string, any>>;
    number?: number;
    sort?: SortObject;
    numberOfElements?: number;
    empty?: boolean;
};

