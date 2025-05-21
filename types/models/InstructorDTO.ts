/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ProfessionalBodyDTO } from './ProfessionalBodyDTO';
import type { TrainingExperienceDTO } from './TrainingExperienceDTO';
import type { UserCertificationDTO } from './UserCertificationDTO';
/**
 * Data Transfer Object for Instructor information
 */
export type InstructorDTO = {
    /**
     * Unique identifier for the instructor
     */
    uuid?: string;
    /**
     * Reference to the associated user account
     */
    user_uuid?: string;
    /**
     * Full name of the instructor
     */
    readonly full_name?: string;
    /**
     * Latitude coordinate of instructor's location
     */
    latitude?: number;
    /**
     * Longitude coordinate of instructor's location
     */
    longitude?: number;
    /**
     * Website or portfolio URL of the instructor
     */
    website?: string;
    /**
     * Biography or personal description of the instructor
     */
    bio?: string;
    /**
     * Professional headline or title of the instructor
     */
    professional_headline?: string;
    /**
     * Professional body affiliations of the instructor
     */
    professional_bodies?: Array<ProfessionalBodyDTO>;
    /**
     * Training experience details of the instructor
     */
    training_experiences?: Array<TrainingExperienceDTO>;
    /**
     * Certifications held by the instructor
     */
    certifications?: Array<UserCertificationDTO>;
    /**
     * User who last updated the record
     */
    readonly updated_by?: string;
    /**
     * Timestamp when the record was created
     */
    readonly created_date?: string;
    /**
     * User who created the record
     */
    readonly created_by?: string;
    /**
     * Timestamp when the record was last updated
     */
    readonly updated_date?: string;
};

