/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateCourseLearningObjectiveRequestDTO } from './CreateCourseLearningObjectiveRequestDTO';
import type { PricingRequestDTO } from './PricingRequestDTO';
import type { UpdateCourseCategoryRequestDTO } from './UpdateCourseCategoryRequestDTO';
export type CreateCourseRequestDTO = {
    name?: string;
    description?: string;
    thumbnailUrl?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    durationHours?: number;
    minAge?: number;
    maxAge?: number;
    classLimit?: number;
    pricing?: PricingRequestDTO;
    learningObjectives?: Array<CreateCourseLearningObjectiveRequestDTO>;
    categories?: Array<UpdateCourseCategoryRequestDTO>;
    instructorIds?: Array<number>;
};

