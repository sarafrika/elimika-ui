'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage } from '@/lib/error-utils';
import {
  cancelObligation,
  createOrganisationUser,
  createTrainingBranch1,
  deleteTrainingBranch1,
  type DomainNameEnum,
  type DomainNameEnum2,
  type Organisation,
  type OrganisationUserCreateRequestDto,
  resendOrganisationInvitation,
  revokeOrganisationInvitation,
  settleObligation,
  setOrganisationUserDomain,
  type TrainingBranch,
  updateOrganisation,
  updateTrainingBranch1,
} from '@/services/client';
import { invalidateAdminOverview, invalidateAfterVerification } from '../lib/admin-queries';

/** Reads the status off a thrown response so the message matches what really failed. */
function statusOf(error: unknown): number | undefined {
  if (!error || typeof error !== 'object') return undefined;
  const record = error as { status?: unknown; response?: { status?: unknown } };
  const status = record.status ?? record.response?.status;
  return typeof status === 'number' ? status : undefined;
}

export interface BranchFormValues {
  branch_name: string;
  address?: string;
  poc_name: string;
  poc_email: string;
  poc_telephone: string;
  latitude?: number | null;
  longitude?: number | null;
  active: boolean;
}

/**
 * Suspend or reactivate an organisation. PUT replaces the record, `name` is required and
 * `active` is a primitive boolean, so the full DTO goes back with the flag set explicitly
 * — a partial body would either 400 or silently deactivate the organisation.
 */
export function useSetOrganisationActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisation,
      active,
    }: {
      organisation: Organisation;
      active: boolean;
    }) => {
      const { data } = await updateOrganisation({
        path: { uuid: organisation.uuid ?? '' },
        body: {
          name: organisation.name,
          description: organisation.description,
          licence_no: organisation.licence_no,
          location: organisation.location,
          country: organisation.country,
          latitude: organisation.latitude,
          longitude: organisation.longitude,
          active,
        },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAfterVerification(queryClient);
      toast.success(
        `${variables.organisation.name} is ${variables.active ? 'active again' : 'suspended'}`
      );
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not update ${variables.organisation.name}`)),
  });
}

/** Create or update a training branch. */
export function useSaveBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      branchUuid,
      values,
    }: {
      organisationUuid: string;
      branchUuid?: string;
      values: BranchFormValues;
    }) => {
      const body: TrainingBranch = {
        organisation_uuid: organisationUuid,
        branch_name: values.branch_name,
        address: values.address || null,
        latitude: values.latitude ?? null,
        longitude: values.longitude ?? null,
        poc_name: values.poc_name,
        poc_email: values.poc_email,
        poc_telephone: values.poc_telephone,
        active: values.active,
      };

      if (branchUuid) {
        const { data } = await updateTrainingBranch1({
          path: { uuid: organisationUuid, branchUuid },
          body,
          throwOnError: true,
        });
        return data;
      }

      const { data } = await createTrainingBranch1({
        path: { uuid: organisationUuid },
        body,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAdminOverview(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['getTrainingBranchesByOrganisation'] });
      toast.success(`${variables.values.branch_name} saved`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not save ${variables.values.branch_name}`)),
  });
}

/** Soft-delete a branch: it goes inactive and members lose their branch. */
export function useDeleteBranch() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      branchUuid,
    }: {
      organisationUuid: string;
      branchUuid: string;
      branchName: string;
    }) => {
      const { data } = await deleteTrainingBranch1({
        path: { uuid: organisationUuid, branchUuid },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['getTrainingBranchesByOrganisation'] });
      toast.success(`${variables.branchName} removed`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not remove ${variables.branchName}`)),
  });
}

/** Change a member's org-scoped role, and optionally their branch. */
export function useSetMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      userUuid,
      domainName,
      branchUuid,
    }: {
      organisationUuid: string;
      userUuid: string;
      domainName: DomainNameEnum;
      branchUuid?: string | null;
      memberName: string;
    }) => {
      const { data } = await setOrganisationUserDomain({
        path: { uuid: organisationUuid, userUuid },
        body: { domain_name: domainName, branch_uuid: branchUuid ?? null },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAdminOverview(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['getUsersByOrganisation'] });
      toast.success(`${variables.memberName} is now ${variables.domainName.replace(/_/g, ' ')}`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not update ${variables.memberName}`)),
  });
}

/** Add a staff member. Students are invited instead; the API rejects them here. */
export function useAddOrganisationStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      values,
    }: {
      organisationUuid: string;
      values: OrganisationUserCreateRequestDto & { domain_name: DomainNameEnum2 };
    }) => {
      const { data } = await createOrganisationUser({
        path: { uuid: organisationUuid },
        body: values,
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await invalidateAdminOverview(queryClient);
      await queryClient.invalidateQueries({ queryKey: ['getUsersByOrganisation'] });
      toast.success(`${variables.values.first_name} ${variables.values.last_name} added`);
    },
    onError: (error, variables) => {
      const status = statusOf(error);
      if (status === 400) {
        toast.error(
          getErrorMessage(error, 'That email already exists, or students must be invited instead')
        );
        return;
      }
      toast.error(getErrorMessage(error, `Could not add ${variables.values.email}`));
    },
  });
}

/** Withdraw an invitation that has not been accepted. */
export function useRevokeInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      invitationUuid,
    }: {
      organisationUuid: string;
      invitationUuid: string;
      recipient: string;
    }) => {
      const { data } = await revokeOrganisationInvitation({
        path: { organisationUuid, invitationUuid },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['listOrganisationInvitations'] });
      toast.success(`Invitation to ${variables.recipient} withdrawn`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not withdraw ${variables.recipient}'s invitation`)),
  });
}

/** Send the invitation again with a fresh token and expiry. */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      invitationUuid,
    }: {
      organisationUuid: string;
      invitationUuid: string;
      recipient: string;
    }) => {
      const { data } = await resendOrganisationInvitation({
        path: { organisationUuid, invitationUuid },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['listOrganisationInvitations'] });
      toast.success(`Invitation resent to ${variables.recipient}`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not resend to ${variables.recipient}`)),
  });
}

/** Record that the organisation paid an instructor off-platform. */
export function useSettleObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      obligationUuid,
      settlementReference,
      note,
    }: {
      organisationUuid: string;
      obligationUuid: string;
      settlementReference: string;
      note?: string;
      instructorName: string;
    }) => {
      const { data } = await settleObligation({
        path: { organisationUuid, obligationUuid },
        body: { settlement_reference: settlementReference, note: note || undefined },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['listObligations'] });
      await queryClient.invalidateQueries({ queryKey: ['getMonthlySettlements'] });
      toast.success(`Settlement recorded for ${variables.instructorName}`);
    },
    onError: (error, variables) =>
      toast.error(getErrorMessage(error, `Could not settle for ${variables.instructorName}`)),
  });
}

/** Withdraw an obligation that should never have accrued. */
export function useCancelObligation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organisationUuid,
      obligationUuid,
      reason,
    }: {
      organisationUuid: string;
      obligationUuid: string;
      reason: string;
      instructorName: string;
    }) => {
      const { data } = await cancelObligation({
        path: { organisationUuid, obligationUuid },
        body: { reason },
        throwOnError: true,
      });
      return data;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['listObligations'] });
      toast.success(`Obligation for ${variables.instructorName} cancelled`);
    },
    onError: (error, variables) => {
      const status = statusOf(error);
      if (status === 409) {
        toast.error('That obligation is already settled, so it cannot be cancelled');
        return;
      }
      toast.error(getErrorMessage(error, `Could not cancel for ${variables.instructorName}`));
    },
  });
}
