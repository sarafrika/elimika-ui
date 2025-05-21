/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryRequestDTO } from '../models/CategoryRequestDTO';
import type { CreateCategoryRequestDTO } from '../models/CreateCategoryRequestDTO';
import type { Pageable } from '../models/Pageable';
import type { ResponseDTOCategoryResponseDTO } from '../models/ResponseDTOCategoryResponseDTO';
import type { ResponsePageableDTOCategoryResponseDTO } from '../models/ResponsePageableDTOCategoryResponseDTO';
import type { UpdateCategoryRequestDTO } from '../models/UpdateCategoryRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CategoryControllerService {
    /**
     * @param categoryId
     * @returns ResponseDTOCategoryResponseDTO OK
     * @throws ApiError
     */
    public static getCategory(
        categoryId: number,
    ): CancelablePromise<ResponseDTOCategoryResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/categories/{categoryId}',
            query: {
                'categoryId': categoryId,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @param categoryId
     * @param requestBody
     * @returns ResponseDTOCategoryResponseDTO OK
     * @throws ApiError
     */
    public static updateCategory(
        categoryId: number,
        requestBody: UpdateCategoryRequestDTO,
    ): CancelablePromise<ResponseDTOCategoryResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/categories/{categoryId}',
            path: {
                'categoryId': categoryId,
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
     * @param categoryId
     * @returns void
     * @throws ApiError
     */
    public static deleteCategory(
        categoryId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/categories/{categoryId}',
            path: {
                'categoryId': categoryId,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @param categoryRequestDto
     * @param pageable
     * @returns ResponsePageableDTOCategoryResponseDTO OK
     * @throws ApiError
     */
    public static getAllCategories(
        categoryRequestDto: CategoryRequestDTO,
        pageable: Pageable,
    ): CancelablePromise<ResponsePageableDTOCategoryResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/categories',
            query: {
                'categoryRequestDTO': categoryRequestDto,
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
     * @returns ResponseDTOCategoryResponseDTO Created
     * @throws ApiError
     */
    public static createCategory(
        requestBody: CreateCategoryRequestDTO,
    ): CancelablePromise<ResponseDTOCategoryResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/categories',
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
