/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponseOrganisationDTO } from '../models/ApiResponseOrganisationDTO';
import type { ApiResponsePagedDTOOrganisationDTO } from '../models/ApiResponsePagedDTOOrganisationDTO';
import type { ApiResponseVoid } from '../models/ApiResponseVoid';
import type { OrganisationDTO } from '../models/OrganisationDTO';
import type { Pageable } from '../models/Pageable';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class OrganisationsApiService {
    /**
     * Get an organisation by UUID
     * @param uuid
     * @returns ApiResponseOrganisationDTO Organisation retrieved successfully
     * @throws ApiError
     */
    public static getOrganisationByUuid(
        uuid: string,
    ): CancelablePromise<ApiResponseOrganisationDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/organisations/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Organisation not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update an organisation by UUID
     * @param uuid
     * @param requestBody
     * @returns ApiResponseOrganisationDTO Organisation updated successfully
     * @throws ApiError
     */
    public static updateOrganisation(
        uuid: string,
        requestBody: OrganisationDTO,
    ): CancelablePromise<ApiResponseOrganisationDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/organisations/{uuid}',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input data`,
                404: `Organisation not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete an organisation by UUID
     * @param uuid
     * @returns ApiResponseVoid Organisation deleted successfully
     * @throws ApiError
     */
    public static deleteOrganisation(
        uuid: string,
    ): CancelablePromise<ApiResponseVoid> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/organisations/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Organisation not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all organisations
     * @param pageable
     * @returns ApiResponsePagedDTOOrganisationDTO Organisations retrieved successfully
     * @throws ApiError
     */
    public static getAllOrganisations(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOOrganisationDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/organisations',
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
     * Create a new organisation
     * @param requestBody
     * @returns ApiResponseOrganisationDTO Organisation created successfully
     * @throws ApiError
     */
    public static createOrganisation(
        requestBody: OrganisationDTO,
    ): CancelablePromise<ApiResponseOrganisationDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/organisations',
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
     * Search organisations
     * Fetches a paginated list of organisations based on optional filters. Supports pagination and sorting.
     * @param pageable
     * @returns ApiResponsePagedDTOOrganisationDTO Paginated list of organisations matching the search criteria
     * @throws ApiError
     */
    public static search2(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOOrganisationDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/organisations/search',
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
