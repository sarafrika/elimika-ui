import * as React from 'react';
import { Button, Section, Text } from 'react-email';
import { ElimikaEmailLayout } from '../components/ElimikaEmailLayout';

const dashboardHref = '[[${frontendUrl}]]';
const recipientNamePlaceholder = '[[${recipientName}]]';
const createdAtPlaceholder = '[[${createdAt}]]';

export function AccountCreatedEmail() {
  return (
    <ElimikaEmailLayout
      preview='Your Elimika account has been created successfully.'
      eyebrow='Account created'
      title='Welcome to Elimika'
    >
      <Text style={paragraph}>Hello {recipientNamePlaceholder},</Text>

      <Text style={paragraph}>
        Your Elimika account has been created successfully. You can now sign in, complete your
        profile, and continue with the learning or training workspace available to your account.
      </Text>

      <Section style={detailsPanel}>
        <Text style={detailLabel}>Created on</Text>
        <Text style={detailValue}>{createdAtPlaceholder} UTC</Text>
      </Section>

      <Button
        href={dashboardHref}
        style={primaryButton}
        {...({ 'th:href': '${frontendUrl}' } as Record<string, string>)}
      >
        Open Elimika
      </Button>

      <Text style={securityNote}>
        If you did not create this account, contact support immediately so the account can be
        reviewed.
      </Text>
    </ElimikaEmailLayout>
  );
}

export default AccountCreatedEmail;

const paragraph = {
  margin: '0 0 16px',
  color: '#314155',
  fontSize: '15px',
  lineHeight: '24px',
};

const detailsPanel = {
  margin: '22px 0',
  padding: '16px 18px',
  backgroundColor: '#f4f8ff',
  border: '1px solid #dbe8ff',
  borderRadius: '8px',
};

const detailLabel = {
  margin: '0 0 4px',
  color: '#5f6b7a',
  fontSize: '12px',
  lineHeight: '18px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0',
};

const detailValue = {
  margin: '0',
  color: '#172033',
  fontSize: '15px',
  lineHeight: '22px',
  fontWeight: '700',
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
