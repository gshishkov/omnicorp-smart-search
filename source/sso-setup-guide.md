---
title: Single Sign-On (SSO) Setup Guide
owner: Identity & Security Engineering
lastReviewed: 2026-10-20
---

# Single Sign-On (SSO) Setup Guide

OmniCorp supports single sign-on with SAML 2.0 and OpenID Connect (OIDC). SSO is available on the
Professional and Enterprise plans. It is not available on the Starter plan.

## Supported identity providers

OmniCorp has tested integrations with Okta, Microsoft Entra ID (formerly Azure AD), Google Workspace,
OneLogin and Ping Identity. Any SAML 2.0 compliant identity provider should work, but only the listed
providers are covered by OmniCorp support.

## Prerequisites

- The customer must be a workspace Owner to configure SSO.
- The customer's email domain must be verified in Settings → Security → Domains by adding a DNS TXT record.
- At least one Owner account must keep password login as a break-glass account until SSO is tested.

## Configuring SAML 2.0

1. In OmniCorp, go to Settings → Security → Single Sign-On and choose **SAML 2.0**.
2. Copy the Assertion Consumer Service (ACS) URL and the Entity ID shown on the page.
3. In the identity provider, create a new SAML application and paste the ACS URL and Entity ID.
4. Configure the NameID format as email address and map the attributes `email`, `firstName` and `lastName`.
5. Download the identity provider metadata XML and upload it in OmniCorp.
6. Click **Test connection**. Only enable SSO after a successful test.

## Configuring OpenID Connect

For OIDC, the customer creates an application in the identity provider and enters the Issuer URL, Client
ID and Client Secret in OmniCorp. The redirect URI to register is shown on the OmniCorp SSO settings page.
OIDC requires the `openid`, `email` and `profile` scopes.

## Enforcing SSO and provisioning

After a successful test, Owners can enable **Enforce SSO**, which disables password login for all users
except the break-glass accounts. Enterprise customers can also enable SCIM 2.0 provisioning to create,
update and deactivate users automatically from the identity provider. SCIM is not available on the
Professional plan.

Just-in-time (JIT) provisioning is available on both Professional and Enterprise plans. New users created
through JIT receive the Member role by default.

## Troubleshooting

- **"Invalid signature" error:** the signing certificate in OmniCorp does not match the identity provider. Re-upload the latest metadata XML.
- **Users land on the password page:** the user's email domain is not verified, or SSO is not enforced.
- **Clock skew errors:** SAML assertions are rejected if the identity provider clock differs from OmniCorp by more than 3 minutes.

Escalate SSO issues that block all users of a workspace as Severity 2. If no Owner can log in at all,
escalate as Severity 1.
