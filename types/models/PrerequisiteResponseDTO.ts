/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CourseResponseDTO } from './CourseResponseDTO';
import type { PrerequisiteTypeResponseDTO } from './PrerequisiteTypeResponseDTO';
export type PrerequisiteResponseDTO = {
    id?: number;
    prerequisiteType?: PrerequisiteTypeResponseDTO;
    course?: CourseResponseDTO;
    requiredForCourse?: CourseResponseDTO;
    minimumScore?: number;
};

