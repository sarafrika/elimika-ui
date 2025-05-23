/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AnswerOptionResponseDTO } from './AnswerOptionResponseDTO';
export type QuestionResponseDTO = {
    id?: number;
    description?: string;
    questionType?: string;
    pointValue?: number;
    orderInAssessment?: number;
    answerOptions?: Array<AnswerOptionResponseDTO>;
};

