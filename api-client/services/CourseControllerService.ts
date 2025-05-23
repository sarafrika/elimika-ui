/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseRequestDTO } from '../models/CourseRequestDTO';
import type { CreateCourseRequestDTO } from '../models/CreateCourseRequestDTO';
import type { Pageable } from '../models/Pageable';
import type { ResponseDTOCourseResponseDTO } from '../models/ResponseDTOCourseResponseDTO';
import type { ResponsePageableDTOCourseResponseDTO } from '../models/ResponsePageableDTOCourseResponseDTO';
import type { UpdateCourseRequestDTO } from '../models/UpdateCourseRequestDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class CourseControllerService {
    /**
     * @param courseId
     * @returns ResponseDTOCourseResponseDTO OK
     * @throws ApiError
     */
    public static getCourse(
        courseId: number,
    ): CancelablePromise<ResponseDTOCourseResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/{courseId}',
            path: {
                'courseId': courseId,
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
     * @param requestBody
     * @returns ResponseDTOCourseResponseDTO OK
     * @throws ApiError
     */
    public static updateCourse(
        courseId: number,
        requestBody: UpdateCourseRequestDTO,
    ): CancelablePromise<ResponseDTOCourseResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/courses/{courseId}',
            path: {
                'courseId': courseId,
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
     * @returns void
     * @throws ApiError
     */
    public static deleteCourse(
        courseId: number,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/courses/{courseId}',
            path: {
                'courseId': courseId,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @param courseRequestDto
     * @param pageable
     * @returns ResponsePageableDTOCourseResponseDTO OK
     * @throws ApiError
     */
    public static getCourses(
        courseRequestDto: CourseRequestDTO,
        pageable: Pageable,
    ): CancelablePromise<ResponsePageableDTOCourseResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses',
            query: {
                'courseRequestDTO': courseRequestDto,
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
     * @param formData
     * @returns ResponseDTOCourseResponseDTO Created
     * @throws ApiError
     */
    public static createCourse(
        formData?: {
            course: CreateCourseRequestDTO;
            thumbnail: Blob;
        },
    ): CancelablePromise<ResponseDTOCourseResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/courses',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * @param fileName
     * @returns binary OK
     * @throws ApiError
     */
    public static getCourseThumbnail(
        fileName: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/courses/thumbnail/{fileName}',
            path: {
                'fileName': fileName,
            },
            errors: {
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
}
