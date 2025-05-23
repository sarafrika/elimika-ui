/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateLessonContentDTO } from './CreateLessonContentDTO';
import type { CreateLessonResourceRequestDTO } from './CreateLessonResourceRequestDTO';
export type CreateLessonRequestDTO = {
    title?: string;
    description?: string;
    lessonOrder?: number;
    isPublished?: boolean;
    content?: Array<CreateLessonContentDTO>;
    resources?: Array<CreateLessonResourceRequestDTO>;
};

