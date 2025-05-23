/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateLessonRequestDTO } from '../models/CreateLessonRequestDTO';
import type { Pageable } from '../models/Pageable';
import type { ResponseDTOLessonResponseDTO } from '../models/ResponseDTOLessonResponseDTO';
import type { ResponseDTOVoid } from '../models/ResponseDTOVoid';
import type { ResponsePageableDTOLessonResponseDTO } from '../models/ResponsePageableDTOLessonResponseDTO';
import type { UpdateLessonRequestDTO } from '../models/UpdateLessonRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class LessonControllerService {
    /**
     * @param courseId
     * @param lessonId
     * @returns ResponseDTOLessonResponseDTO OK
     * @throws ApiError
     */
    public static getLesson(
        courseId: number,
        lessonId: number,
    ): CancelablePromise<ResponseDTOLessonResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/{courseId}/lessons/{lessonId}',
            path: {
                'courseId': courseId,
                'lessonId': lessonId,
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
     * @param lessonId
     * @param requestBody
     * @returns ResponseDTOVoid OK
     * @throws ApiError
     */
    public static updateLesson(
        courseId: number,
        lessonId: number,
        requestBody: UpdateLessonRequestDTO,
    ): CancelablePromise<ResponseDTOVoid> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/courses/{courseId}/lessons/{lessonId}',
            path: {
                'courseId': courseId,
                'lessonId': lessonId,
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
     * @param courseId
     * @param lessonId
     * @returns void
     * @throws ApiError
     */
    public static deleteLesson(
        courseId: number,
        lessonId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/courses/{courseId}/lessons/{lessonId}',
            path: {
                'courseId': courseId,
                'lessonId': lessonId,
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
     * @param courseId
     * @returns ResponsePageableDTOLessonResponseDTO OK
     * @throws ApiError
     */
    public static getLessons(
        pageable: Pageable,
        courseId: number,
    ): CancelablePromise<ResponsePageableDTOLessonResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/{courseId}/lessons',
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
    /**
     * @param courseId
     * @param formData
     * @returns ResponseDTOLessonResponseDTO Created
     * @throws ApiError
     */
    public static createLesson(
        courseId: number,
        formData?: {
            lesson: CreateLessonRequestDTO;
            files?: Array<Blob>;
        },
    ): CancelablePromise<ResponseDTOLessonResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/courses/{courseId}/lessons',
            path: {
                'courseId': courseId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
}
