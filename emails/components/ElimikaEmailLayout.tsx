import * as React from 'react';
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Section,
  Text,
} from 'react-email';

type ElimikaEmailLayoutProps = {
  preview: string;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
};

const supportEmailPlaceholder = '[[${supportEmail}]]';
const currentYearPlaceholder = '[[${currentYear}]]';
const companyNamePlaceholder = '[[${companyName}]]';

const colors = {
  background: '#f4f7fb',
  card: '#ffffff',
  ink: '#172033',
  muted: '#5f6b7a',
  border: '#dfe7f2',
  blue: '#0061ed',
  blueDark: '#0645b8',
  green: '#00a86b',
  footer: '#eef3f9',
};

export function ElimikaEmailLayout({
  preview,
  title,
  eyebrow = 'Elimika notification',
  children,
}: ElimikaEmailLayoutProps) {
  return (
    <Html lang='en' {...({ 'xmlns:th': 'http://www.thymeleaf.org' } as Record<string, string>)}>
      <Head>
        <title>{preview}</title>
      </Head>
      <Body style={body}>
        <Container style={container}>
          <Section style={brandBar}>
            <Img
              src='cid:elimikaLogo'
              alt='Elimika'
              width='112'
              height='112'
              style={logo}
            />
            <Text style={brandKicker}>Powered by Sarafrika</Text>
          </Section>

          <Section style={hero}>
            <Text style={eyebrowStyle}>{eyebrow}</Text>
            <Heading as='h1' style={heading}>
              {title}
            </Heading>
          </Section>

          <Section style={content}>{children}</Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              Need help? Contact{' '}
              <a
                href='mailto:[[${supportEmail}]]'
                style={footerLink}
                {...({ 'th:href': "${'mailto:' + supportEmail}" } as Record<string, string>)}
              >
                {supportEmailPlaceholder}
              </a>
              .
            </Text>
            <Text style={footerText}>
              Copyright {currentYearPlaceholder} {companyNamePlaceholder}. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = {
  margin: '0',
  backgroundColor: colors.background,
  color: colors.ink,
  fontFamily: 'Arial, Helvetica, sans-serif',
};

const container = {
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  padding: '32px 16px',
};

const brandBar = {
  backgroundColor: colors.card,
  borderTopLeftRadius: '8px',
  borderTopRightRadius: '8px',
  border: `1px solid ${colors.border}`,
  borderBottom: '0',
  padding: '24px 32px 18px',
};

const logo = {
  display: 'block',
  width: '112px',
  height: '112px',
  objectFit: 'contain',
};

const brandKicker = {
  margin: '8px 0 0',
  color: colors.muted,
  fontSize: '12px',
  lineHeight: '18px',
  letterSpacing: '0',
};

const hero = {
  backgroundColor: colors.blue,
  backgroundImage: `linear-gradient(135deg, ${colors.blue} 0%, ${colors.blueDark} 100%)`,
  padding: '30px 32px',
};

const eyebrowStyle = {
  margin: '0 0 10px',
  color: '#dbeafe',
  fontSize: '12px',
  lineHeight: '18px',
  fontWeight: '700',
  textTransform: 'uppercase' as const,
  letterSpacing: '0',
};

const heading = {
  margin: '0',
  color: '#ffffff',
  fontSize: '28px',
  lineHeight: '36px',
  fontWeight: '700',
  letterSpacing: '0',
};

const content = {
  backgroundColor: colors.card,
  borderLeft: `1px solid ${colors.border}`,
  borderRight: `1px solid ${colors.border}`,
  padding: '30px 32px 8px',
};

const divider = {
  margin: '0',
  borderColor: colors.border,
  borderStyle: 'solid',
  borderWidth: '1px 0 0',
};

const footer = {
  backgroundColor: colors.footer,
  borderBottomLeftRadius: '8px',
  borderBottomRightRadius: '8px',
  border: `1px solid ${colors.border}`,
  borderTop: '0',
  padding: '20px 32px 24px',
};

const footerText = {
  margin: '0 0 8px',
  color: colors.muted,
  fontSize: '12px',
  lineHeight: '18px',
};

const footerLink = {
  color: colors.blue,
  textDecoration: 'none',
  fontWeight: '700',
};
