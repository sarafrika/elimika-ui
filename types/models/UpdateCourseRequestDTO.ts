/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { PricingRequestDTO } from './PricingRequestDTO';
import type { UpdateCourseCategoryRequestDTO } from './UpdateCourseCategoryRequestDTO';
import type { UpdateCourseLearningObjectiveRequestDTO } from './UpdateCourseLearningObjectiveRequestDTO';
export type UpdateCourseRequestDTO = {
    name?: string;
    description?: string;
    thumbnailUrl?: string;
    durationHours?: number;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    minAge?: number;
    maxAge?: number;
    pricing?: PricingRequestDTO;
    learningObjectives?: Array<UpdateCourseLearningObjectiveRequestDTO>;
    categories?: Array<UpdateCourseCategoryRequestDTO>;
};

