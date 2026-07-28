import * as React from 'react';
import { Button, Section, Text } from 'react-email';
import { ElimikaEmailLayout } from '../components/ElimikaEmailLayout';

const consentHref = '[[${consentLink}]]';
const guardianName = '[[${guardianName}]]';
const studentName = '[[${studentName}]]';
const organisationName = '[[${organisationName}]]';
const roleName = '[[${roleName}]]';

export function GuardianConsentEmail() {
  return (
    <ElimikaEmailLayout
      preview='Your approval is needed before a child can join an organisation on Elimika.'
      eyebrow='Approval needed'
      title='Your approval is needed'
    >
      <Text style={paragraph}>Hello {guardianName},</Text>

      <Text style={paragraph}>
        {studentName} has been invited to join <strong>{organisationName}</strong> on Elimika as a{' '}
        {roleName}, and named you as their parent or guardian.
      </Text>

      <Text style={paragraph}>
        Because they are under the age at which we accept consent directly,{' '}
        <strong>nothing has been set up</strong>. They will not be enrolled and the organisation
        gains no access unless you approve it here.
      </Text>

      <Button
        href={consentHref}
        style={primaryButton}
        {...({ 'th:href': '${consentLink}' } as Record<string, string>)}
      >
        Review and decide
      </Button>

      <Section style={scopePanel}>
        <Text style={scopeTitle}>What {organisationName} will be able to see</Text>
        <Text style={scopeText}>
          If you approve, this organisation will be able to see the child&apos;s enrolment,
          attendance and performance in <strong>its own courses and classes only</strong> — not
          their learning anywhere else on Elimika.
        </Text>
        <Text style={scopeTitle}>What you will be able to see</Text>
        <Text style={scopeText}>
          Approving also links your account to theirs, so you can follow their learning. You choose
          how much you see, and you can withdraw your approval at any time.
        </Text>
      </Section>

      <Text style={securityNote}>
        If you are not this child&apos;s parent or guardian, or you were not expecting this, please
        decline using the link above. This request expires on its own if you do nothing.
      </Text>
    </ElimikaEmailLayout>
  );
}

export default GuardianConsentEmail;

const paragraph = {
  margin: '0 0 16px',
  color: '#314155',
  fontSize: '15px',
  lineHeight: '24px',
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
  margin: '0 0 14px',
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
