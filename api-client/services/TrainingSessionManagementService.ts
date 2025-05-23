/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ApiResponsePagedDTOTrainingSessionDTO } from '../models/ApiResponsePagedDTOTrainingSessionDTO';
import type { Page } from '../models/Page';
import type { Pageable } from '../models/Pageable';
import type { TrainingSessionDTO } from '../models/TrainingSessionDTO';
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
export class TrainingSessionManagementService {
    /**
     * Get training session by ID
     * Fetches a training session by its UUID.
     * @param uuid
     * @returns TrainingSessionDTO Training session found
     * @throws ApiError
     */
    public static getTrainingSessionById(
        uuid: string,
    ): CancelablePromise<TrainingSessionDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/training-sessions/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Training session not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Update a training session
     * Updates an existing training session record.
     * @param uuid
     * @param requestBody
     * @returns TrainingSessionDTO Training session updated successfully
     * @throws ApiError
     */
    public static updateTrainingSession(
        uuid: string,
        requestBody: TrainingSessionDTO,
    ): CancelablePromise<TrainingSessionDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/training-sessions/{uuid}',
            path: {
                'uuid': uuid,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Training session not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Delete a training session
     * Removes a training session record from the system.
     * @param uuid
     * @returns void
     * @throws ApiError
     */
    public static deleteTrainingSession(
        uuid: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/training-sessions/{uuid}',
            path: {
                'uuid': uuid,
            },
            errors: {
                404: `Training session not found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Get all training sessions
     * Fetches a paginated list of training sessions.
     * @param pageable
     * @returns ApiResponsePagedDTOTrainingSessionDTO OK
     * @throws ApiError
     */
    public static getAllTrainingSessions(
        pageable: Pageable,
    ): CancelablePromise<ApiResponsePagedDTOTrainingSessionDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/training-sessions',
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
     * Create a new training session
     * Saves a new training session record in the system.
     * @param requestBody
     * @returns TrainingSessionDTO Training session created successfully
     * @throws ApiError
     */
    public static createTrainingSession(
        requestBody: TrainingSessionDTO,
    ): CancelablePromise<TrainingSessionDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/training-sessions',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid request data`,
                404: `Not Found`,
                422: `Unprocessable Entity`,
                500: `Internal Server Error`,
            },
        });
    }
    /**
     * Search training sessions
     * Search for training sessions based on criteria.
     * @param searchParams
     * @param pageable
     * @returns Page Search results returned successfully
     * @throws ApiError
     */
    public static searchTrainingSessions(
        searchParams: Record<string, string>,
        pageable: Pageable,
    ): CancelablePromise<Page> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/training-sessions/search',
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
