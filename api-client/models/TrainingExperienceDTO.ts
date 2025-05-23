/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type TrainingExperienceDTO = {
    /**
     * Name of the organisation where the experience was gained
     */
    organisation_name: string;
    /**
     * Job title held during the training or experience
     */
    job_title: string;
    /**
     * Description of responsibilities and tasks performed
     */
    work_description: string;
    /**
     * Start date of the training/experience (ISO 8601 format)
     */
    start_date: string;
    /**
     * End date of the training/experience (ISO 8601 format)
     */
    end_date: string;
    /**
     * UUID of the user associated with this training/experience
     */
    user_uuid: string;
};

