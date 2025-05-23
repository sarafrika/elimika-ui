/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { LessonContentResponseDTO } from './LessonContentResponseDTO';
import type { LessonResourceResponseDTO } from './LessonResourceResponseDTO';
export type LessonResponseDTO = {
    id?: number;
    title?: string;
    description?: string;
    lessonOrder?: number;
    isPublished?: boolean;
    content?: Array<LessonContentResponseDTO>;
    resources?: Array<LessonResourceResponseDTO>;
};

