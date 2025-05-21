/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PermissionDTO } from './PermissionDTO';
export type RoleDTO = {
    uuid?: string;
    organisation_uuid: string;
    name: string;
    description?: string;
    active?: boolean;
    permissions?: Array<PermissionDTO>;
    readonly modified_date?: string;
    readonly created_date?: string;
};

