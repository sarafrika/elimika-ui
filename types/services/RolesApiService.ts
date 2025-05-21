/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseListPermissionDTO } from '../models/ApiResponseListPermissionDTO';
import type { ApiResponseListRoleDTO } from '../models/ApiResponseListRoleDTO';
import type { ApiResponsePagedDTORoleDTO } from '../models/ApiResponsePagedDTORoleDTO';
import type { ApiResponseRoleDTO } from '../models/ApiResponseRoleDTO';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { Pageable } from '../models/Pageable';
import type { RoleDTO } from '../models/RoleDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class RolesApiService {
    /**
     * Get a role by UUID
     * @param uuid
     * @returns ApiResponseRoleDTO Role retrieved successfully
     * @throws ApiError
     */
    public static getRoleByUuid(
        uuid: string,
    ): CancelablePromise<ApiResponseRoleDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Role not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a role by UUID
     * @param uuid
     * @param requestBody
     * @returns ApiResponseRoleDTO Role updated successfully
     * @throws ApiError
     */
    public static updateRole(
        uuid: string,
        requestBody: RoleDTO,
    ): CancelablePromise<ApiResponseRoleDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/roles/{uuid}',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                404: `Role not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a role by UUID
     * @param uuid
     * @returns ApiResponseVoid Role deleted successfully
     * @throws ApiError
     */
    public static deleteRole(
        uuid: string,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/roles/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Role not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a new role for an organisation
     * @param requestBody
     * @returns ApiResponseRoleDTO Role created successfully
     * @throws ApiError
     */
    public static createRole(
        requestBody: RoleDTO,
    ): CancelablePromise<ApiResponseRoleDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/roles',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get effective roles for a user
     * Fetches roles for a user, considering both direct and group assignments, with precedence given to user roles.
     * @param userUuid
     * @returns ApiResponseListRoleDTO Roles retrieved successfully
     * @throws ApiError
     */
    public static getEffectiveRolesForUser(
        userUuid: string,
    ): CancelablePromise<ApiResponseListRoleDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/users/{userUuid}/roles',
            path: {
                'userUuid': userUuid,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Search roles
     * Fetches a paginated list of roles based on optional filters. Supports pagination and sorting.
     * @param pageable
     * @returns ApiResponsePagedDTORoleDTO Paginated list of roles matching the search criteria
     * @throws ApiError
     */
    public static searchRoles(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTORoleDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/search',
            query: {
                'pageable': pageable,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Fetch all available permissions
     * Retrieve a list of all available permissions that can be assigned to roles.
     * @returns ApiResponseListPermissionDTO Permissions retrieved successfully
     * @throws ApiError
     */
    public static getAllPermissions(): CancelablePromise<ApiResponseListPermissionDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/permissions',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all roles for a specific organisation
     * @param organisationUid
     * @param pageable
     * @returns ApiResponsePagedDTORoleDTO Roles retrieved successfully
     * @throws ApiError
     */
    public static getRolesByOrganisation(
        organisationUid: string,
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTORoleDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/roles/organisation/{organisationUid}',
            path: {
                'organisationUid': organisationUid,
            },
            query: {
                'pageable': pageable,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
}
