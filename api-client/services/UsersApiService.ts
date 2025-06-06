/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePagedDTOUser } from '../models/ApiResponsePagedDTOUser';
import type { ApiResponseUser } from '../models/ApiResponseUser';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { Pageable } from '../models/Pageable';
import type { User } from '../models/User';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersApiService {
    /**
     * Get a user by UUID
     * @param uuid
     * @returns ApiResponseUser User retrieved successfully
     * @throws ApiError
     */
    public static getUserByUuid(
        uuid: string,
    ): CancelablePromise<ApiResponseUser> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `User not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a user by UUID
     * @param uuid
     * @param requestBody
     * @returns ApiResponseUser User updated successfully
     * @throws ApiError
     */
    public static updateUser(
        uuid: string,
        requestBody?: {
            user: User;
            profile_image?: Blob;
        },
    ): CancelablePromise<ApiResponseUser> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/users/{uuid}',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                404: `User not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a user by UUID
     * @param uuid
     * @returns ApiResponseVoid User deleted successfully
     * @throws ApiError
     */
    public static deleteUser(
        uuid: string,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/users/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `User not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Search users
     * Fetches a paginated list of users based on optional filters. Supports pagination and sorting.
     * @param pageable
     * @returns ApiResponsePagedDTOUser Paginated list of users matching the search criteria
     * @throws ApiError
     */
    public static search(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOUser> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/search',
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
     * Get user profile image by file name
     * @param fileName
     * @returns binary Profile image retrieved successfully
     * @throws ApiError
     */
    public static getProfileImage(
        fileName: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/profile-image/{fileName}',
            path: {
                'fileName': fileName,
            },
            errors: {
                404: `Profile image not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get users by organisation ID
     * @param organisationId
     * @param pageable
     * @returns ApiResponsePagedDTOUser Users retrieved successfully
     * @throws ApiError
     */
    public static getUsersByOrganisation(
        organisationId: string,
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOUser> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/users/organisation/{organisationId}',
            path: {
                'organisationId': organisationId,
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
