import * as React from 'react';
import { Button, Section, Text } from 'react-email';
import { ElimikaEmailLayout } from '../components/ElimikaEmailLayout';

const invitationHref = '[[${invitationLink}]]';
const organisationName = '[[${organisationName}]]';
const recipientName = '[[${recipientName}]]';
const inviterName = '[[${inviterName}]]';
const roleName = '[[${roleName}]]';
const personalMessage = '[[${personalMessage}]]';

export function OrganisationInvitationEmail() {
  return (
    <ElimikaEmailLayout
      preview='You have been invited to join an organisation on Elimika.'
      eyebrow='Invitation'
      title='You have been invited'
    >
      <Text style={paragraph}>Hello {recipientName},</Text>

      <Text style={paragraph}>
        {inviterName} has invited you to join <strong>{organisationName}</strong> on Elimika as a{' '}
        {roleName}.
      </Text>

      <Section
        style={quotePanel}
        {...({ 'th:if': '${personalMessage != null and !personalMessage.isEmpty()}' } as Record<
          string,
          string
        >)}
      >
        <Text style={quoteText}>{personalMessage}</Text>
      </Section>

      <Button
        href={invitationHref}
        style={primaryButton}
        {...({ 'th:href': '${invitationLink}' } as Record<string, string>)}
      >
        Review this invitation
      </Button>

      <Section style={scopePanel}>
        <Text style={scopeTitle}>What {organisationName} will be able to see</Text>
        <Text style={scopeText}>
          If you accept, this organisation will be able to see your enrolment, attendance and
          performance in <strong>its own courses and classes only</strong>. Your learning with any
          other institution on Elimika, and the rest of your account, stays private to you.
        </Text>
      </Section>

      <Text style={securityNote}>
        Nothing happens until you accept — no account is changed and no organisation gains access
        before then. You can decline instead, and this invitation expires on its own if you do
        nothing. If you were not expecting this, you can safely ignore this email.
      </Text>
    </ElimikaEmailLayout>
  );
}

export default OrganisationInvitationEmail;

const paragraph = {
  margin: '0 0 16px',
  color: '#314155',
  fontSize: '15px',
  lineHeight: '24px',
};

const quotePanel = {
  margin: '22px 0',
  padding: '14px 18px',
  backgroundColor: '#f7f8fa',
  borderLeft: '3px solid #cbd5e1',
  borderRadius: '4px',
};

const quoteText = {
  margin: '0',
  color: '#314155',
  fontSize: '14px',
  lineHeight: '22px',
  fontStyle: 'italic' as const,
};

const scopePanel = {
  margin: '22px 0',
  padding: '16px 18px',
  backgroundColor: '#f4f8ff',
  border: '1px solid #dbe8ff',
  borderRadius: '8px',
};

const scopeTitle = {
  margin: '0 0 6px',
  color: '#172033',
  fontSize: '13px',
  lineHeight: '20px',
  fontWeight: '700',
};

const scopeText = {
  margin: '0',
  color: '#314155',
  fontSize: '14px',
  lineHeight: '22px',
};

const primaryButton = {
  display: 'inline-block',
  margin: '8px 0 22px',
  backgroundColor: '#0061ed',
  borderRadius: '6px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700',
  lineHeight: '20px',
  padding: '13px 20px',
  textDecoration: 'none',
};

const securityNote = {
  margin: '2px 0 18px',
  color: '#5f6b7a',
  fontSize: '13px',
  lineHeight: '20px',
};
