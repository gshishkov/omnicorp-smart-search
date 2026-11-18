---
title: Data Retention and Privacy
owner: Legal & Compliance
lastReviewed: 2026-07-12
---

# Data Retention and Privacy

This article summarises how OmniCorp stores, retains and deletes customer data, and how CSMs should handle
privacy requests. It is guidance for CSMs, not legal advice; route contractual questions to Legal.

## Data residency

Customers choose a data region when their workspace is created: United States (Virginia), European Union
(Frankfurt) or Asia-Pacific (Sydney). Customer content is stored and processed only in the selected region.
Changing the region of an existing workspace requires a migration project, is available only on the
Enterprise plan and typically takes 4–6 weeks.

## Retention periods

- **Active workspaces:** customer content is retained for the life of the subscription.
- **Deleted items:** items deleted by users stay in the workspace trash for 30 days and can be restored by an Owner.
- **Backups:** encrypted backups are kept for 35 days.
- **Audit logs:** retained for 1 year on Professional and 7 years on Enterprise.
- **After contract termination:** customer content is kept for 90 days so the customer can export it, then permanently deleted within the following 30 days.

## Data export

Owners can export all workspace content at any time from Settings → Data → Export. Exports are delivered as
a ZIP archive with JSON and CSV files and are available for download for 7 days.

## Privacy requests (GDPR and CCPA)

When a customer forwards a data subject request (access, correction or deletion), the CSM must create a
Privacy Request ticket within 1 business day and must not handle the data directly. The Privacy team
responds to the customer within 30 days, as required by GDPR. CSMs must never send customer personal data
over chat or personal email.

## Security certifications

OmniCorp holds SOC 2 Type II and ISO 27001 certifications. Customers can request the latest SOC 2 report
through the Trust Center after signing a non-disclosure agreement. CSMs must not send the report as an
email attachment.

## Encryption

Customer data is encrypted in transit with TLS 1.2 or higher and at rest with AES-256. Enterprise customers
can use customer-managed encryption keys (BYOK) through AWS KMS.
