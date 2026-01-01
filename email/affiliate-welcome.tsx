import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Button,
  Hr,
} from '@react-email/components';
import { APP_NAME } from '@/lib/constants';

interface AffiliateWelcomeEmailProps {
  affiliateName: string;
  referralCode: string;
  referralLink: string;
  commissionPro: number;
  commissionEnterprise: number;
}

export default function AffiliateWelcomeEmail({
  affiliateName,
  referralCode,
  referralLink,
  commissionPro,
  commissionEnterprise,
}: AffiliateWelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Welcome to the {APP_NAME} Affiliate Program! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerSection}>
            <Heading style={h1}>🎉 Welcome to the Affiliate Program!</Heading>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Text style={greeting}>Hi {affiliateName},</Text>
            
            <Text style={paragraph}>
              Congratulations! You've been accepted into the <strong>{APP_NAME}</strong> Affiliate Program. 
              We're excited to have you on board as a partner!
            </Text>

            <Text style={paragraph}>
              Start earning commissions by sharing your unique referral link with property managers, 
              landlords, and real estate professionals who could benefit from our platform.
            </Text>
          </Section>

          {/* Referral Code Box */}
          <Section style={codeSection}>
            <Text style={codeLabel}>Your Referral Code</Text>
            <Text style={codeValue}>{referralCode}</Text>
          </Section>

          {/* Referral Link */}
          <Section style={linkSection}>
            <Text style={linkLabel}>Your Referral Link</Text>
            <Text style={linkValue}>{referralLink}</Text>
            <Button style={copyButton} href={referralLink}>
              Visit Your Link
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Commission Structure */}
          <Section style={contentSection}>
            <Heading style={h2}>💰 Your Commission Structure</Heading>
            
            <Section style={commissionGrid}>
              <Section style={commissionCard}>
                <Text style={planName}>Pro Plan</Text>
                <Text style={planPrice}>$29.99/month</Text>
                <Text style={commissionAmount}>${commissionPro} per signup</Text>
              </Section>
              
              <Section style={commissionCard}>
                <Text style={planName}>Enterprise Plan</Text>
                <Text style={planPrice}>$79.99/month</Text>
                <Text style={commissionAmount}>${commissionEnterprise} per signup</Text>
              </Section>
            </Section>

            <Text style={smallText}>
              Commissions are held for 30 days after signup to ensure customer retention, 
              then become available for payout.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Tips Section */}
          <Section style={contentSection}>
            <Heading style={h2}>📈 Tips for Success</Heading>
            
            <Text style={tipItem}>
              <strong>1. Share on Social Media</strong> - Post about {APP_NAME} on LinkedIn, 
              Facebook, or Twitter to reach property professionals.
            </Text>
            
            <Text style={tipItem}>
              <strong>2. Write a Review</strong> - If you've used our platform, share your 
              experience to build trust with potential signups.
            </Text>
            
            <Text style={tipItem}>
              <strong>3. Target the Right Audience</strong> - Focus on landlords, property 
              managers, and real estate investors who manage multiple properties.
            </Text>
            
            <Text style={tipItem}>
              <strong>4. Highlight Key Features</strong> - Mention tenant screening, rent 
              collection, maintenance tracking, and our contractor marketplace.
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Dashboard Link */}
          <Section style={dashboardSection}>
            <Text style={dashboardLabel}>Track Your Progress</Text>
            <Text style={dashboardText}>
              View your clicks, signups, and earnings in real-time on your affiliate dashboard.
            </Text>
            <Button style={dashboardButton} href="https://www.propertyflowhq.com/affiliate-program/dashboard">
              Go to Dashboard
            </Button>
          </Section>

          <Hr style={divider} />

          {/* Footer */}
          <Section style={footerSection}>
            <Text style={footerText}>
              Questions? Reply to this email and we'll be happy to help.
            </Text>
            <Text style={footerText}>
              Thank you for partnering with us!
            </Text>
            <Text style={signature}>
              — The {APP_NAME} Team
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// Styles
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const headerSection = {
  backgroundColor: '#7c3aed',
  padding: '32px 40px',
  textAlign: 'center' as const,
};

const h1 = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: '700',
  margin: '0',
  padding: '0',
};

const h2 = {
  color: '#1e293b',
  fontSize: '20px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const contentSection = {
  padding: '32px 40px',
};

const greeting = {
  color: '#1e293b',
  fontSize: '18px',
  fontWeight: '600',
  margin: '0 0 16px 0',
};

const paragraph = {
  color: '#475569',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px 0',
};

const codeSection = {
  backgroundColor: '#f1f5f9',
  borderRadius: '12px',
  margin: '0 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const codeLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
};

const codeValue = {
  color: '#7c3aed',
  fontSize: '32px',
  fontWeight: '700',
  fontFamily: 'monospace',
  margin: '0',
  letterSpacing: '4px',
};

const linkSection = {
  backgroundColor: '#faf5ff',
  borderRadius: '12px',
  border: '1px solid #e9d5ff',
  margin: '16px 40px 0',
  padding: '24px',
  textAlign: 'center' as const,
};

const linkLabel = {
  color: '#64748b',
  fontSize: '12px',
  fontWeight: '600',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
  margin: '0 0 8px 0',
};

const linkValue = {
  color: '#7c3aed',
  fontSize: '14px',
  fontWeight: '500',
  margin: '0 0 16px 0',
  wordBreak: 'break-all' as const,
};

const copyButton = {
  backgroundColor: '#7c3aed',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};

const divider = {
  borderColor: '#e2e8f0',
  margin: '0',
};

const commissionGrid = {
  display: 'flex',
  gap: '16px',
  marginBottom: '16px',
};

const commissionCard = {
  backgroundColor: '#f8fafc',
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center' as const,
  flex: '1',
  border: '1px solid #e2e8f0',
};

const planName = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  margin: '0 0 4px 0',
};

const planPrice = {
  color: '#64748b',
  fontSize: '12px',
  margin: '0 0 8px 0',
};

const commissionAmount = {
  color: '#059669',
  fontSize: '18px',
  fontWeight: '700',
  margin: '0',
};

const smallText = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '20px',
  margin: '0',
};

const tipItem = {
  color: '#475569',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 12px 0',
};

const footerSection = {
  padding: '24px 40px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#64748b',
  fontSize: '14px',
  margin: '0 0 8px 0',
};

const signature = {
  color: '#1e293b',
  fontSize: '14px',
  fontWeight: '600',
  margin: '16px 0 0 0',
};

const dashboardSection = {
  backgroundColor: '#f0fdf4',
  borderRadius: '12px',
  border: '1px solid #bbf7d0',
  margin: '0 40px',
  padding: '24px',
  textAlign: 'center' as const,
};

const dashboardLabel = {
  color: '#166534',
  fontSize: '16px',
  fontWeight: '600',
  margin: '0 0 8px 0',
};

const dashboardText = {
  color: '#475569',
  fontSize: '14px',
  margin: '0 0 16px 0',
};

const dashboardButton = {
  backgroundColor: '#16a34a',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '600',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '12px 24px',
};
