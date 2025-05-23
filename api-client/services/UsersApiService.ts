/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePagedDTOUserDTO } from '../models/ApiResponsePagedDTOUserDTO';
import type { ApiResponseUserDTO } from '../models/ApiResponseUserDTO';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { Pageable } from '../models/Pageable';
import type { UserDTO } from '../models/UserDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class UsersApiService {
    /**
     * Get a user by UUID
     * @param uuid
     * @returns ApiResponseUserDTO User retrieved successfully
     * @throws ApiError
     */
    public static getUserByUuid(
        uuid: string,
    ): CancelablePromise<ApiResponseUserDTO> {
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
     * @returns ApiResponseUserDTO User updated successfully
     * @throws ApiError
     */
    public static updateUser(
        uuid: string,
        requestBody: UserDTO,
    ): CancelablePromise<ApiResponseUserDTO> {
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
     * Create a new user
     * @param userDomain Domain of the user
     * @param requestBody
     * @returns ApiResponseUserDTO User created successfully
     * @throws ApiError
     */
    public static createUser(
        userDomain: 'student' | 'instructor' | 'admin' | 'organisation_user',
        requestBody?: {
            user: UserDTO;
            profile_image?: Blob;
        },
    ): CancelablePromise<ApiResponseUserDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/users',
            query: {
                'user_domain': userDomain,
            },
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
     * Search users
     * Fetches a paginated list of users based on optional filters. Supports pagination and sorting.
     * @param pageable
     * @returns ApiResponsePagedDTOUserDTO Paginated list of users matching the search criteria
     * @throws ApiError
     */
    public static search(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOUserDTO> {
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
     * @returns ApiResponsePagedDTOUserDTO Users retrieved successfully
     * @throws ApiError
     */
    public static getUsersByOrganisation(
        organisationId: string,
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOUserDTO> {
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
