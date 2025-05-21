/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePagedDTORoleDTO } from '../models/ApiResponsePagedDTORoleDTO';
import type { ApiResponsePagedDTOUserDTO } from '../models/ApiResponsePagedDTOUserDTO';
import type { ApiResponsePagedDTOUserGroupDTO } from '../models/ApiResponsePagedDTOUserGroupDTO';
import type { ApiResponseUserGroupDTO } from '../models/ApiResponseUserGroupDTO';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { Pageable } from '../models/Pageable';
import type { UserGroupDTO } from '../models/UserGroupDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UserGroupApiService {
    /**
     * Get a user group by UUID
     * @param uuid
     * @returns ApiResponseUserGroupDTO OK
     * @throws ApiError
     */
    public static getUserGroupByUuid(
        uuid: string,
    ): CancelablePromise<ApiResponseUserGroupDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-groups/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a user group by UUID
     * @param uuid
     * @param requestBody
     * @returns ApiResponseUserGroupDTO OK
     * @throws ApiError
     */
    public static updateUserGroup(
        uuid: string,
        requestBody: UserGroupDTO,
    ): CancelablePromise<ApiResponseUserGroupDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/user-groups/{uuid}',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a user group by UUID
     * @param uuid
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static deleteUserGroup(
        uuid: string,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/user-groups/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Create a new user group
     * @param requestBody
     * @returns ApiResponseUserGroupDTO OK
     * @throws ApiError
     */
    public static createUserGroup(
        requestBody: UserGroupDTO,
    ): CancelablePromise<ApiResponseUserGroupDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-groups',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get users for a user group
     * @param uuid
     * @param pageable
     * @returns ApiResponsePagedDTOUserDTO Users retrieved successfully
     * @throws ApiError
     */
    public static getUsersForUserGroup(
        uuid: string,
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOUserDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-groups/{uuid}/users',
            path: {
                'uuid': uuid,
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
    /**
     * Add users to a user group
     * @param uuid
     * @param requestBody
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static addUsersToGroup(
        uuid: string,
        requestBody: Array<string>,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-groups/{uuid}/users',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Remove users from a user group
     * @param uuid
     * @param requestBody
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static removeUsersFromGroup(
        uuid: string,
        requestBody: Array<string>,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/user-groups/{uuid}/users',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get roles for a user group
     * @param uuid
     * @param pageable
     * @returns ApiResponsePagedDTORoleDTO Roles retrieved successfully
     * @throws ApiError
     */
    public static getRolesForUserGroup(
        uuid: string,
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTORoleDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-groups/{uuid}/roles',
            path: {
                'uuid': uuid,
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
    /**
     * Assign roles to a user group
     * @param uuid
     * @param requestBody
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static assignRolesToGroup(
        uuid: string,
        requestBody: Array<string>,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/user-groups/{uuid}/roles',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Remove roles from a user group
     * @param uuid
     * @param requestBody
     * @returns ApiResponseVoid OK
     * @throws ApiError
     */
    public static removeRolesFromGroup(
        uuid: string,
        requestBody: Array<string>,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/user-groups/{uuid}/roles',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Search user groups
     * Fetches a paginated list of user groups based on optional filters. Supports pagination and sorting.
     * @param pageable
     * @returns ApiResponsePagedDTOUserGroupDTO Paginated list of user groups matching the search criteria
     * @throws ApiError
     */
    public static search1(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOUserGroupDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-groups/search',
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
     * Get all user groups for an organisation
     * @param organisationUuid
     * @param pageable
     * @returns ApiResponsePagedDTOUserGroupDTO OK
     * @throws ApiError
     */
    public static getUserGroupsByOrganisation(
        organisationUuid: string,
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOUserGroupDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/user-groups/organisation/{organisationUuid}',
            path: {
                'organisationUuid': organisationUuid,
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
