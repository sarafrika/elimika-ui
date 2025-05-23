/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { UpdateAnswerOptionRequestDTO } from './UpdateAnswerOptionRequestDTO';
export type UpdateQuestionRequestDTO = {
    description?: string;
    questionType?: string;
    pointValue?: number;
    orderInAssessment?: number;
    answerOptions?: Array<UpdateAnswerOptionRequestDTO>;
};

