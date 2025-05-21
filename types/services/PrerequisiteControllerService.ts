/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePrerequisiteGroupRequestDTO } from '../models/CreatePrerequisiteGroupRequestDTO';
import type { CreatePrerequisiteRequestDTO } from '../models/CreatePrerequisiteRequestDTO';
import type { Pageable } from '../models/Pageable';
import type { PrerequisiteRequestDTO } from '../models/PrerequisiteRequestDTO';
import type { ResponseDTOVoid } from '../models/ResponseDTOVoid';
import type { ResponsePageableDTOPrerequisiteResponseDTO } from '../models/ResponsePageableDTOPrerequisiteResponseDTO';
import type { UpdatePrerequisiteGroupRequestDTO } from '../models/UpdatePrerequisiteGroupRequestDTO';
import type { UpdatePrerequisiteRequestDTO } from '../models/UpdatePrerequisiteRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PrerequisiteControllerService {
    /**
     * @param prerequisiteId
     * @param requestBody
     * @returns ResponseDTOVoid OK
     * @throws ApiError
     */
    public static updatePrerequisite(
        prerequisiteId: number,
        requestBody: UpdatePrerequisiteRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/prerequisite/{prerequisiteId}',
            path: {
                'prerequisiteId': prerequisiteId,
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
     * @param prerequisiteId
     * @returns void
     * @throws ApiError
     */
    public static deletePrerequisite(
        prerequisiteId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/prerequisite/{prerequisiteId}',
            path: {
                'prerequisiteId': prerequisiteId,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @param prerequisiteGroupId
     * @param requestBody
     * @returns ResponseDTOVoid OK
     * @throws ApiError
     */
    public static updatePrerequisiteGroup(
        prerequisiteGroupId: number,
        requestBody: UpdatePrerequisiteGroupRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/prerequisite/group/{prerequisiteGroupId}',
            path: {
                'prerequisiteGroupId': prerequisiteGroupId,
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
     * @param prerequisiteGroupId
     * @returns void
     * @throws ApiError
     */
    public static deletePrerequisiteGroup(
        prerequisiteGroupId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/prerequisite/group/{prerequisiteGroupId}',
            path: {
                'prerequisiteGroupId': prerequisiteGroupId,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @param prerequisiteRequestDto
     * @param pageable
     * @returns ResponsePageableDTOPrerequisiteResponseDTO OK
     * @throws ApiError
     */
    public static findPrerequisites(
        prerequisiteRequestDto: PrerequisiteRequestDTO,
        pageable: Pageable,
    ): CancelablePromise<ResponsePageableDTOPrerequisiteResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prerequisite',
            query: {
                'prerequisiteRequestDTO': prerequisiteRequestDto,
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
     * @param requestBody
     * @returns ResponseDTOVoid Created
     * @throws ApiError
     */
    public static createPrerequisite(
        requestBody: CreatePrerequisiteRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prerequisite',
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
     * @param requestBody
     * @returns ResponseDTOVoid Created
     * @throws ApiError
     */
    public static createPrerequisiteGroup(
        requestBody: CreatePrerequisiteGroupRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prerequisite/group',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
}
