/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePagedDTOStudent } from '../models/ApiResponsePagedDTOStudent';
import type { Page } from '../models/Page';
import type { Pageable } from '../models/Pageable';
import type { Student } from '../models/Student';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class StudentManagementService {
    /**
     * Get student by ID
     * Fetches a student by their UUID.
     * @param uuid
     * @returns Student Student found
     * @throws ApiError
     */
    public static getStudentById(
        uuid: string,
    ): CancelablePromise<Student> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/students/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Student not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a student
     * Updates an existing student record.
     * @param uuid
     * @param requestBody
     * @returns Student Student updated successfully
     * @throws ApiError
     */
    public static updateStudent(
        uuid: string,
        requestBody: Student,
    ): CancelablePromise<Student> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/students/{uuid}',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Student not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a student
     * Removes a student record from the system.
     * @param uuid
     * @returns void
     * @throws ApiError
     */
    public static deleteStudent(
        uuid: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/students/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Student not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all students
     * Fetches a paginated list of students.
     * @param pageable
     * @returns ApiResponsePagedDTOStudent OK
     * @throws ApiError
     */
    public static getAllStudents(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOStudent> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/students',
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
     * Search students
     * Search for students based on criteria.
     * @param searchParams
     * @param pageable
     * @returns Page Search results returned successfully
     * @throws ApiError
     */
    public static searchStudents(
        searchParams: Record<string, string>,
        pageable: Pageable,
    ): CancelablePromise<Page> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/students/search',
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
