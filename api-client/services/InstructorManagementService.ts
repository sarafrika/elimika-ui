/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePagedDTOInstructorDTO } from '../models/ApiResponsePagedDTOInstructorDTO';
import type { InstructorDTO } from '../models/InstructorDTO';
import type { Page } from '../models/Page';
import type { Pageable } from '../models/Pageable';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class InstructorManagementService {
    /**
     * Get instructor by UUID
     * Fetches an instructor by their UUID.
     * @param uuid
     * @returns InstructorDTO Instructor found
     * @throws ApiError
     */
    public static getInstructorByUuid(
        uuid: string,
    ): CancelablePromise<InstructorDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instructors/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Instructor not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update an instructor
     * Updates an existing instructor record.
     * @param uuid
     * @param requestBody
     * @returns InstructorDTO Instructor updated successfully
     * @throws ApiError
     */
    public static updateInstructor(
        uuid: string,
        requestBody: InstructorDTO,
    ): CancelablePromise<InstructorDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/instructors/{uuid}',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Instructor not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete an instructor
     * Removes an instructor record from the system.
     * @param uuid
     * @returns void
     * @throws ApiError
     */
    public static deleteInstructor(
        uuid: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/instructors/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Instructor not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all instructors
     * Fetches a paginated list of instructors.
     * @param pageable
     * @returns ApiResponsePagedDTOInstructorDTO OK
     * @throws ApiError
     */
    public static getAllInstructors(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOInstructorDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instructors',
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
     * Search instructors
     * Search for instructors based on criteria.
     * @param searchParams
     * @param pageable
     * @returns Page Search results returned successfully
     * @throws ApiError
     */
    public static searchInstructors(
        searchParams: Record<string, string>,
        pageable: Pageable,
    ): CancelablePromise<Page> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/instructors/search',
            query: {
                'searchParams': searchParams,
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
