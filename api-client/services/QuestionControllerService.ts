/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateQuestionRequestDTO } from '../models/CreateQuestionRequestDTO';
import type { Pageable } from '../models/Pageable';
import type { ResponseDTOQuestionResponseDTO } from '../models/ResponseDTOQuestionResponseDTO';
import type { ResponseDTOVoid } from '../models/ResponseDTOVoid';
import type { ResponsePageableDTOQuestionResponseDTO } from '../models/ResponsePageableDTOQuestionResponseDTO';
import type { UpdateQuestionRequestDTO } from '../models/UpdateQuestionRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class QuestionControllerService {
    /**
     * @param assessmentId
     * @param id
     * @returns ResponseDTOQuestionResponseDTO OK
     * @throws ApiError
     */
    public static getQuestion(
        assessmentId: number,
        id: number,
    ): CancelablePromise<ResponseDTOQuestionResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assessments/{assessmentId}/questions/{id}',
            path: {
                'assessmentId': assessmentId,
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
     * @param assessmentId
     * @param id
     * @param requestBody
     * @returns ResponseDTOVoid OK
     * @throws ApiError
     */
    public static updateQuestion(
        assessmentId: number,
        id: number,
        requestBody: UpdateQuestionRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/assessments/{assessmentId}/questions/{id}',
            path: {
                'assessmentId': assessmentId,
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
     * @param assessmentId
     * @param id
     * @returns void
     * @throws ApiError
     */
    public static deleteQuestion(
        assessmentId: number,
        id: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/assessments/{assessmentId}/questions/{id}',
            path: {
                'assessmentId': assessmentId,
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
     * @param pageable
     * @param assessmentId
     * @returns ResponsePageableDTOQuestionResponseDTO OK
     * @throws ApiError
     */
    public static getQuestions(
        pageable: Pageable,
        assessmentId: number,
    ): CancelablePromise<ResponsePageableDTOQuestionResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/assessments/{assessmentId}/questions',
            path: {
                'assessmentId': assessmentId,
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
     * @param assessmentId
     * @param requestBody
     * @returns ResponseDTOVoid Created
     * @throws ApiError
     */
    public static createQuestion(
        assessmentId: number,
        requestBody: CreateQuestionRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/assessments/{assessmentId}/questions',
            path: {
                'assessmentId': assessmentId,
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
}
