/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RoleDTO } from './RoleDTO';
export type UserDTO = {
    /**
     * Unique identifier of the user
     */
    uuid: string;
    /**
     * User's first name
     */
    first_name: string;
    /**
     * User's middle name (Optional)
     */
    middle_name?: string;
    /**
     * User's last name
     */
    last_name: string;
    /**
     * User's email address
     */
    email: string;
    /**
     * User's phone number
     */
    phone_number: string;
    /**
     * Last modified timestamp
     */
    readonly modified_date?: string;
    /**
     * User's date of birth
     */
    dob: string;
    /**
     * Username used for login
     */
    username: string;
    /**
     * UUID of the organisation the user belongs to
     */
    organisation_uuid?: string;
    /**
     * Indicates if the user is active
     */
    active?: boolean;
    /**
     * Roles assigned to the user
     */
    roles?: Array<RoleDTO>;
    /**
     * URL of the user's profile image
     */
    readonly profile_image_url?: string;
    /**
     * Creation timestamp
     */
    readonly created_date?: string;
};

