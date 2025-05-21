/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CategoryResponseDTO } from './CategoryResponseDTO';
import type { CourseLearningObjectiveResponseDTO } from './CourseLearningObjectiveResponseDTO';
import type { PricingResponseDTO } from './PricingResponseDTO';
export type CourseResponseDTO = {
    id?: number;
    name?: string;
    code?: string;
    description?: string;
    durationHours?: number;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    minAge?: number;
    maxAge?: number;
    classLimit?: number;
    pricing?: PricingResponseDTO;
    learningObjectives?: Array<CourseLearningObjectiveResponseDTO>;
    categories?: Array<CategoryResponseDTO>;
};

