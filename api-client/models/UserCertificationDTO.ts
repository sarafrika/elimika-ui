/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserCertificationDTO = {
    /**
     * Date the certificate was issued (ISO 8601 format)
     */
    issued_date: string;
    /**
     * Name of the issuing organization
     */
    issued_by: string;
    /**
     * URL pointing to the certificate resource
     */
    certificate_url: string;
    /**
     * UUID of the user who owns this certificate
     */
    user_uuid: string;
};

