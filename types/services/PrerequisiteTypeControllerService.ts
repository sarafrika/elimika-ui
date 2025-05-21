/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreatePrerequisiteTypeRequestDTO } from '../models/CreatePrerequisiteTypeRequestDTO';
import type { Pageable } from '../models/Pageable';
import type { ResponseDTOVoid } from '../models/ResponseDTOVoid';
import type { ResponsePageableDTOPrerequisiteTypeResponseDTO } from '../models/ResponsePageableDTOPrerequisiteTypeResponseDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class PrerequisiteTypeControllerService {
    /**
     * @param pageable
     * @returns ResponsePageableDTOPrerequisiteTypeResponseDTO OK
     * @throws ApiError
     */
    public static getPrerequisiteTypes(
        pageable: Pageable,
    ): CancelablePromise<ResponsePageableDTOPrerequisiteTypeResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/prerequisite-types',
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
     * @param requestBody
     * @returns ResponseDTOVoid Created
     * @throws ApiError
     */
    public static createPrerequisiteType(
        requestBody: CreatePrerequisiteTypeRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/prerequisite-types',
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
