/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateAssessmentRequestDTO } from '../models/CreateAssessmentRequestDTO';
import type { Pageable } from '../models/Pageable';
import type { ResponseDTOAssessmentResponseDTO } from '../models/ResponseDTOAssessmentResponseDTO';
import type { ResponseDTOVoid } from '../models/ResponseDTOVoid';
import type { ResponsePageableDTOAssessmentResponseDTO } from '../models/ResponsePageableDTOAssessmentResponseDTO';
import type { UpdateAssessmentRequestDTO } from '../models/UpdateAssessmentRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class AssessmentControllerService {
    /**
     * @param id
     * @returns ResponseDTOAssessmentResponseDTO OK
     * @throws ApiError
     */
    public static getAssessment(
        id: number,
    ): CancelablePromise<ResponseDTOAssessmentResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assessments/{id}',
            path: {
                'id': id,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @param id
     * @param requestBody
     * @returns ResponseDTOVoid OK
     * @throws ApiError
     */
    public static updateAssessment(
        id: number,
        requestBody: UpdateAssessmentRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/assessments/{id}',
            path: {
                'id': id,
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
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteAssessment(
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/assessments/{id}',
            path: {
                'id': id,
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
    public static createAssessment(
        requestBody: CreateAssessmentRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/assessments',
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
     * @param lessonId
     * @param pageable
     * @returns ResponsePageableDTOAssessmentResponseDTO OK
     * @throws ApiError
     */
    public static getAssessmentsByLesson(
        lessonId: number,
        pageable: Pageable,
    ): CancelablePromise<ResponsePageableDTOAssessmentResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assessments/lesson/{lessonId}',
            path: {
                'lessonId': lessonId,
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
     * @param courseId
     * @param pageable
     * @returns ResponsePageableDTOAssessmentResponseDTO OK
     * @throws ApiError
     */
    public static getAssessmentsByCourse(
        courseId: number,
        pageable: Pageable,
    ): CancelablePromise<ResponsePageableDTOAssessmentResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assessments/course/{courseId}',
            path: {
                'courseId': courseId,
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
