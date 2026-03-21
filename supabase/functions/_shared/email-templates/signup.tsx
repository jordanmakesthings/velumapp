/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Confirm your Velum account</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://icwcszaasekfhzpxrxzd.supabase.co/storage/v1/object/public/email-assets/logo-lotus.jpg" width="48" height="48" alt="Velum" style={logo} />
        <Heading style={h1}>Confirm your Velum account</Heading>
        <Text style={text}>
          Welcome to Velum. Please confirm your email address to get started.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Confirm Email
        </Button>
        <Text style={footer}>
          If you didn't create an account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', system-ui, sans-serif" }
const container = { padding: '40px 25px' }
const logo = { borderRadius: '12px', marginBottom: '24px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  fontFamily: "'Cormorant Garamond', Georgia, serif",
  color: '#111111',
  margin: '0 0 20px',
}
const text = {
  fontSize: '14px',
  color: '#6F8A7E',
  lineHeight: '1.6',
  margin: '0 0 25px',
}
const link = { color: '#111111', textDecoration: 'underline' }
const button = {
  backgroundColor: '#C9A84C',
  color: '#111111',
  fontSize: '14px',
  fontWeight: '500' as const,
  borderRadius: '10px',
  padding: '12px 24px',
  textDecoration: 'none',
}
const footer = { fontSize: '12px', color: '#999999', margin: '30px 0 0' }
