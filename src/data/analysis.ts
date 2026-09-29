import type { SourceAnalysis } from '@/types';

/**
 * Professional sample source used by the "Load Sample" action on the
 * Transform page — a cybersecurity incident report describing a credential
 * phishing campaign targeting enterprise employees.
 */
export const SAMPLE_SOURCE = `INCIDENT REPORT — IR-2026-0847
CLASSIFICATION: INTERNAL / TLP:AMBER
PREPARED BY: Enterprise SOC, Tier 2
DATE: 28-09-2026, 10:15 IST

1. SUMMARY

Beginning 08:52 IST, the SOC observed a coordinated credential-phishing campaign targeting employees across three business units. The campaign impersonates the internal IT service desk using lookalike domains differing by a single character from the corporate domain. The credential-harvesting page is a pixel-accurate clone of the corporate SSO portal, including emulation of the MFA prompt.

2. ATTACK CHAIN

Stage 1 - Delivery: Spear-phishing emails sent from rotating mail providers, subject lines reference a "service-desk password expiry" and carry a single link to the harvesting page.

Stage 2 - Deception: The linked page mirrors the corporate SSO portal pixel-for-pixel and emulates the MFA prompt to also capture second factors.

Stage 3 - Capture: At least 34 employees across Sales, Finance and HR submitted credentials before automated containment.

Stage 4 - Containment: Mail gateway rule set deployed at 09:40 IST; all 34 affected accounts quarantined by 09:51 IST; 11 lookalike domains blocked at the DNS resolver.

3. INDICATORS

- Lookalike domains: 11 registered between 26-08 and 27-09 (withheld from this draft).
- Sending infrastructure: rotating disposable mail providers, 4 clusters.
- Targeted units: Sales, Finance, HR.

4. IMPACT ASSESSMENT

Exposure is limited to credential capture. No lateral movement detected. No data-exfiltration indicators on affected accounts. No customer data affected. Business impact assessed as LOW, with residual risk contingent on credential reuse.

5. RECOMMENDED ACTIONS

- Force password reset and revoke active sessions for the 34 affected accounts.
- Enforce MFA re-registration via conditional access for affected units.
- Block the 11 identified lookalike domains at DNS and mail gateway.
- Accelerate phishing-resistant MFA (FIDO2) rollout for privileged users.

6. REFERENCES

SOC runbook RB-114 (credential-phishing containment); advisory mapping to CERT-In guidance.`;

/** Mock Source Intelligence for the sample report; later replaced by backend analysis. */
export const MOCK_ANALYSIS: SourceAnalysis = {
  contentType: 'Threat Intelligence Report',
  language: 'English',
  estimatedLength: 'medium',
  keyTopics: ['Credential Theft', 'Phishing', 'Enterprise Security', 'Identity Protection'],
  entities: {
    organizations: ['Enterprise SOC', 'CERT-In'],
    systems: ['Corporate SSO Portal', 'Mail Gateway', 'VPN Gateway', 'DNS Resolver'],
    threatActors: ['Unattributed credential-phishing crew'],
  },
  confidence: 94,
};
