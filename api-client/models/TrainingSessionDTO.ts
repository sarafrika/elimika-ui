/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TrainingSessionDTO = {
    uuid?: string;
    course_uuid: string;
    trainer_uuid: string;
    start_date: string;
    end_date: string;
    class_mode: string;
    location?: string;
    meeting_link?: string;
    schedule?: string;
    capacity_limit?: number;
    current_enrollment_count?: number;
    waiting_list_count?: number;
    group_or_individual: string;
};

