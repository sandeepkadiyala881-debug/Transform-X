import type {
  OutputDescriptor,
  AdvisoryBody,
  SummaryBody,
  SocialPostBody,
  PresentationBody,
  InfographicBody,
  VideoPackageBody,
  OutputKind,
  OutputBody,
} from '@/types';

/* ------------------------------ Output catalog ------------------------------ */

export const OUTPUT_CATALOG: OutputDescriptor[] = [
  {
    kind: 'advisory',
    name: 'Advisory',
    tagline: 'Structured advisory for operational communication.',
  },
  {
    kind: 'executive-summary',
    name: 'Executive Summary',
    tagline: 'Concise briefing for decision makers.',
  },
  {
    kind: 'linkedin',
    name: 'LinkedIn',
    tagline: 'Professional, publication-ready content.',
  },
  {
    kind: 'x-twitter',
    name: 'X / Twitter',
    tagline: 'Optimized post or thread.',
  },
  {
    kind: 'presentation',
    name: 'Presentation',
    tagline: 'Slides with speaker notes.',
  },
  {
    kind: 'infographic',
    name: 'Infographic',
    tagline: 'Key messaging and visual structure.',
  },
  {
    kind: 'video-package',
    name: 'Video Package',
    tagline: 'Script, storyboard, narration, subtitles and visual recommendations.',
  },
];

/* --------------------------- Mock output bodies ----------------------------- */

export const MOCK_ADVISORY: AdvisoryBody = {
  kind: 'advisory',
  severity: 'HIGH',
  title: 'Enterprise Credential Phishing Campaign',
  sections: [
    {
      heading: 'Overview',
      paragraphs: [
        'A coordinated credential-phishing campaign is targeting employees across enterprise organisations via spear-phishing emails that impersonate the internal IT service desk. The campaign began on 14 August and has shown sustained volume with an elevated click-through rate against typical baseline.',
      ],
    },
    {
      heading: 'Key Findings',
      paragraphs: [],
      bullets: [
        'Attackers impersonate the IT service desk using lookalike domains differing by a single character from the corporate domain.',
        'The phishing page is an exact visual clone of the corporate SSO portal, including MFA prompt emulation.',
        'At least 34 employees across 3 business units submitted credentials before containment.',
        'Lateral movement has NOT been observed; exposure is currently limited to credential capture.',
      ],
    },
    {
      heading: 'Affected Areas',
      paragraphs: [],
      bullets: [
        'Sales, Finance and HR business units — 34 user accounts (all quarantined)',
        'Corporate SSO portal and VPN gateway (defended, no successful logins)',
        'Email security gateway — detection signatures deployed as of 09:40 IST',
      ],
    },
    {
      heading: 'Recommended Actions',
      paragraphs: [],
      bullets: [
        'Force password reset and revoke active sessions for the 34 affected accounts.',
        'Enforce conditional-access re-registration for MFA on all accounts in affected units.',
        'Block the 11 identified lookalike domains at the DNS resolver and mail gateway.',
        'Deploy the updated service-desk impersonation rule set to all mailboxes.',
      ],
    },
    {
      heading: 'Mitigation',
      paragraphs: [
        'Long-term risk is reduced through phishing-resistant MFA (FIDO2 keys) for privileged users, quarterly lookalike-domain monitoring, and just-in-time access reviews for service-desk impersonation scenarios.',
      ],
    },
  ],
};

export const MOCK_SUMMARY: SummaryBody = {
  kind: 'summary',
  headline: 'Coordinated phishing campaign captured 34 employee credentials; containment complete, no breach confirmed.',
  keyPoints: [
    'Campaign impersonated the internal IT service desk using a single-character lookalike domain and a cloned SSO portal.',
    '34 accounts across Sales, Finance and HR submitted credentials before the mail gateway rule set was deployed at 09:40 IST.',
    'All affected accounts were quarantined within 11 minutes of detection; no lateral movement observed.',
    'Estimated business impact is low — exposure is limited to credential capture, not data exfiltration.',
  ],
  decisionsRequired: [
    'Approve procurement of FIDO2 hardware keys for all privileged users (Q4 budget line).',
    'Approve mandatory lookalike-domain monitoring service engagement.',
    'Confirm external communications stance: no customer data affected, no disclosure required.',
  ],
};

export const MOCK_LINKEDIN: SocialPostBody = {
  kind: 'social',
  platform: 'linkedin',
  text: `Credential phishing campaigns are getting harder to spot — and the latest wave targeting enterprises proves it.

Our team responded to a campaign that cloned the corporate SSO portal pixel-for-pixel and emulated the MFA prompt. 34 employees submitted credentials before automated containment isolated every affected account in under 11 minutes.

Three lessons for security leaders:

1. Lookalike domains differ by one character. Monitor registrations continuously, not quarterly.
2. Phishing-resistant MFA (FIDO2) removes the credential-theft surface entirely for privileged roles.
3. Rehearse the containment runbook — speed of response mattered more than any single control here.

Security is a process, not a product. Share your playbook lessons below.

#CyberSecurity #Phishing #EnterpriseSecurity #IncidentResponse #CISO`,
  hashtags: ['#CyberSecurity', '#Phishing', '#EnterpriseSecurity', '#IncidentResponse'],
};

export const MOCK_X_POST: SocialPostBody = {
  kind: 'social',
  platform: 'x-twitter',
  text: `A phishing campaign cloned our SSO portal — MFA prompt included.

34 credentials captured. 0 accounts compromised. 11 minutes to containment.

What worked:
→ lookalike-domain monitoring
→ phishing-resistant MFA rollout
→ a rehearsed containment runbook

Thread 🧵`,
  hashtags: ['#infosec', '#phishing'],
};

export const MOCK_PRESENTATION: PresentationBody = {
  kind: 'presentation',
  slides: [
    {
      title: 'Enterprise Credential Phishing Campaign',
      bullets: ['Executive briefing', 'Incident timeline & containment', 'Recommended decisions'],
      speakerNotes: 'Set context: this is a contained credential-capture incident. No data breach confirmed. Focus the room on the three decisions required.',
    },
    {
      title: 'What Happened',
      bullets: [
        'Lookalike domain: single character off from corporate domain',
        'Cloned SSO portal with MFA prompt emulation',
        '34 credentials captured across 3 business units',
      ],
      speakerNotes: 'Walk the timeline briefly. Emphasise that detection came from the mail gateway rule set, not user reports — invest in both.',
    },
    {
      title: 'Containment & Impact',
      bullets: [
        'All 34 accounts quarantined within 11 minutes',
        'No lateral movement detected',
        'No customer data affected',
      ],
      speakerNotes: 'Reassure: impact is credential capture only. Business continuity was never at risk.',
    },
    {
      title: 'Decisions Required',
      bullets: [
        'FIDO2 keys for privileged users',
        'Continuous lookalike-domain monitoring',
        'External communications stance',
      ],
      speakerNotes: 'Close with the three asks. Budget line: Q4 security uplift. Offer the full advisory as pre-read.',
    },
  ],
};

export const MOCK_INFOGRAPHIC: InfographicBody = {
  kind: 'infographic',
  headline: 'Credential Phishing: Contained in 11 Minutes',
  stats: [
    { label: 'Credentials captured', value: '34' },
    { label: 'Accounts compromised', value: '0' },
    { label: 'Time to contain', value: '11 min' },
    { label: 'Lookalike domains blocked', value: '11' },
  ],
  callouts: [
    'Attack vector: cloned SSO portal + MFA emulation',
    'Detection: automated mail gateway rule set',
    'Next step: phishing-resistant MFA for privileged users',
  ],
};

export const MOCK_VIDEO_PACKAGE: VideoPackageBody = {
  kind: 'video-package',
  logline:
    'A 90-second security-awareness brief showing how a pixel-perfect phishing clone was detected and contained.',
  script: [
    {
      timecode: '0:00–0:12',
      narration:
        'At 08:52 on a Tuesday morning, employees at an enterprise began receiving an email that looked exactly like a service-desk password notice.',
      visual: 'Slow push-in on an inbox; one email highlighted with a subtle red pulse.',
    },
    {
      timecode: '0:12–0:30',
      narration:
        'The link led to a portal that was pixel-for-pixel identical to the company SSO page — even the multi-factor prompt was emulated.',
      visual: 'Split-screen comparison of real vs fake portal, difference highlighted on the domain bar.',
    },
    {
      timecode: '0:30–0:52',
      narration:
        '34 employees submitted credentials. But the mail gateway had already learned the pattern. Within eleven minutes, every affected account was isolated.',
      visual: 'Animated timeline bar filling to 11:00; account icons dimming one by one as containment spreads.',
    },
    {
      timecode: '0:52–1:20',
      narration:
        'No data left the network. The campaign ended where it started — at the inbox. The next defence is already in your hand: phishing-resistant MFA and a rehearsed response plan.',
      visual: 'Return to calm office wide-shot; final card with the three recommended actions.',
    },
  ],
  subtitles: [
    'At 08:52, employees received a fake service-desk email.',
    'The linked portal cloned the company SSO page, MFA prompt included.',
    '34 employees submitted credentials.',
    'Automated containment isolated every affected account in 11 minutes.',
    'No data left the network.',
    'Next step: phishing-resistant MFA and a rehearsed response plan.',
  ],
};

/* ------------------------------ Body helpers ------------------------------- */

export const BODY_FACTORIES = {
  advisory: () => MOCK_ADVISORY,
  'executive-summary': () => MOCK_SUMMARY,
  linkedin: () => MOCK_LINKEDIN,
  'x-twitter': () => MOCK_X_POST,
  presentation: () => MOCK_PRESENTATION,
  infographic: () => MOCK_INFOGRAPHIC,
  'video-package': () => MOCK_VIDEO_PACKAGE,
} satisfies Record<OutputKind, () => OutputBody>;
