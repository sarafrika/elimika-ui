/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CreateAnswerOptionRequestDTO } from './CreateAnswerOptionRequestDTO';
export type CreateQuestionRequestDTO = {
    description?: string;
    questionType?: string;
    pointValue?: number;
    orderInAssessment?: number;
    answerOptions?: Array<CreateAnswerOptionRequestDTO>;
};

