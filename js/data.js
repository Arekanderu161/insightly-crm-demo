/* Demo data for the Insightly CRM prototype.
   Aaron Rodd mirrors the Dribbble shot exactly (including the designer's "Opportunite" spelling);
   everyone else is invented so the list is clickable. */

const ORGS = {
  salesforce: { name: 'Salesforce' },
  hubspot:    { name: 'HubSpot' },
  clampett:   { name: 'Clampett Oil' },
  arkham:     { name: 'Arkham Studio' },
  northwind:  { name: 'Northwind Realty' },
  bluestone:  { name: 'Bluestone Capital' },
  vertex:     { name: 'Vertex Labs' },
};

/* Logos are drawn in SVG/HTML so they stay crisp at any scale. */
const ORG_LOGOS = {
  salesforce: `<span class="lg lg-sf"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0l1.3 9.2L21 3l-6.2 7.7L24 12l-9.2 1.3L21 21l-7.7-6.2L12 24l-1.3-9.2L3 21l6.2-7.7L0 12l9.2-1.3L3 3l7.7 6.2z"/></svg>salesforce</span>`,
  hubspot:    `<span class="lg lg-hs">HubSp<svg viewBox="0 0 24 24" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><circle cx="13.5" cy="14.6" r="4.6"/><path d="M13.5 10V5.6M10 11.8 5.8 8.6M16.9 18l3 3"/></g><g fill="currentColor"><circle cx="13.5" cy="4.3" r="2.2"/><circle cx="4.9" cy="7.9" r="1.9"/></g></svg>t</span>`,
  clampett:   `<span class="lg lg-cl"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c3.6 4.6 6 8.1 6 11.2a6 6 0 0 1-12 0c0-3.1 2.4-6.6 6-11.2z"/></svg>clampett</span>`,
  arkham:     `<span class="lg lg-ar"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 22 21H2z" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M7.5 15h9" stroke="currentColor" stroke-width="2.4"/></svg>ARKHAM</span>`,
  northwind:  `<span class="lg lg-nw"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 8c3-2.4 6-2.4 9 0s6 2.4 9 0M3 13c3-2.4 6-2.4 9 0s6 2.4 9 0M3 18c3-2.4 6-2.4 9 0" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>northwind</span>`,
  bluestone:  `<span class="lg lg-bs"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2 21 7v10l-9 5-9-5V7z"/></svg>bluestone</span>`,
  vertex:     `<span class="lg lg-vx"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 4h5l4 9 4-9h5l-9 17z"/></svg>vertex</span>`,
};

const DOCS = { insurance: 'assets/doc-insurance.jpg', employment: 'assets/doc-employment.jpg' };

/* Projects anyone can be assigned to; the "4" badge on the Projects widget counts the ones still free. */
const PROJECT_POOL = ['Arkham Rebrand', 'Q2 Outreach', 'Partner Portal', 'Northwind Migration'];

const ME = { name: 'Malik Jordan', role: 'Account Owner', avatar: 'assets/avatars/me.jpg' };

const note = (t, done = false, time = '') => ({ t, done, time });
const opp = (org, name, date, progress, lost = false) => ({ org, name, date, progress, lost });
const file = (name, count, doc) => ({ name, count, doc });
const proj = (name, due, progress) => ({ name, due, progress });

const CONTACTS = [
  { id: 'andrew-marshall', name: 'Andrew Marshall', role: 'Property Manager', title: 'Property Manager',
    org: 'Northwind Realty', phone: '(415) 238-7712', email: 'Andrewmarshall@gmail.com', owner: 'Aaron Rodd',
    related: [['alyssa-andrade', 'Colleague'], ['brian-warren', 'Colleague'], ['carolyn-weaver', 'Friend']],
    orgs: [['northwind', '2 years', 'Property Manager'], ['hubspot', '8 month', 'Advisor']],
    notes: { projects: [note('Tour of the Bayview property', true, '2h'), note('Send updated lease terms to Northwind')],
             personal: [note('Birthday is on March 14')], team: [] },
    opps: [opp('hubspot', 'Property Suite Renewal', '02 Mar 2024', .45)],
    files: [file('Lease contract', 3, 'insurance')],
    projects: [proj('Bayview Renovation', '12 Apr 2024', .4)] },

  { id: 'alexander-reid', name: 'Alexander Reid', role: 'Sales Engineer', title: 'Sales Engineer',
    org: 'Salesforce', phone: '(209) 455-0193', email: 'Alexreid@gmail.com', owner: 'Aaron Rodd',
    related: [['aaron-rodd', 'Colleague'], ['cyrus-alberson', 'Colleague']],
    orgs: [['salesforce', '1 year', 'Sales Engineer']],
    notes: { projects: [note('Prepare demo environment for Clampett', true, '1d')], personal: [],
             team: [note('Share the API limits doc with the team')] },
    opps: [opp('salesforce', 'Clampett Integration Pack', '18 Jan 2024', .3)],
    files: [file('Technical spec', 5, 'employment')],
    projects: [] },

  { id: 'alyssa-andrade', name: 'Alyssa Andrade', role: 'Senior Manager', title: 'Senior Manager',
    org: 'Bluestone Capital', phone: '(646) 302-4418', email: 'Alyssaandrade@gmail.com', owner: 'Clampett CEO',
    related: [['andrew-marshall', 'Colleague'], ['diana-vasquez', 'Friend'], ['carlos-montgomery', 'Partner']],
    orgs: [['bluestone', '3 years', 'Senior Manager'], ['salesforce', '6 month', 'Board Member']],
    notes: { projects: [note('Quarterly review with Bluestone', true, '3h'), note('Draft the Q2 budget proposal')],
             personal: [note('Prefers calls after 4 pm')], team: [] },
    opps: [opp('bluestone', 'Portfolio Analytics Seats', '09 Apr 2024', .8), opp('salesforce', 'Board Reporting Add-on', '21 Nov 2023', .55)],
    files: [file('Service agreement', 6, 'insurance'), file('Board minutes', 2, 'employment')],
    projects: [proj('Bluestone Onboarding', '30 May 2024', .25), proj('Q2 Budget', '15 Apr 2024', .6)] },

  { id: 'aaron-rodd', name: 'Aaron Rodd', role: 'CEO', title: 'Property Manager',
    org: 'Clampett Oil', phone: '(209) 771-3152', email: 'Aaronirodd@gmail.com', owner: 'Clampett CEO',
    related: [['charles-lynch', 'Event Producer'], ['alexander-reid', 'Colleague'], ['anna-henry', 'Friend'], ['christina-little', 'Sister']],
    orgs: [['salesforce', '3 month', 'Board Member'], ['hubspot', '1 year', 'Property Manager']],
    notes: { projects: [note('Arkham Project interview', true, '21m'), note('Assign Aaron to be the lead on the Arkham project'), note('Raise the flat rate by $35 an hour')],
             personal: [], team: [] },
    opps: [opp('salesforce', 'Enterprise 100 User Opportunite', '14 Dec 2023', .98), opp('hubspot', 'Standard 5 User Opportunite', '28 Feb 2023', .06, true)],
    files: [file('Insurance contract', 4, 'insurance'), file('Employment contract', 2, 'employment')],
    projects: [] },

  { id: 'angas-reid', name: 'Angas Reid', role: 'CTO', title: 'Chief Technology Officer',
    org: 'Vertex Labs', phone: '(312) 880-2271', email: 'Angasreid@gmail.com', owner: 'Aaron Rodd',
    related: [['alexander-reid', 'Brother'], ['cyrus-alberson', 'Colleague']],
    orgs: [['vertex', '4 years', 'CTO']],
    notes: { projects: [note('Security audit kickoff', true, '5h'), note('Review the SSO rollout plan'), note('Approve the staging budget')],
             personal: [], team: [note('Hire two backend engineers')] },
    opps: [opp('vertex', 'Platform Migration', '30 Jan 2024', .7), opp('hubspot', 'Marketing Hub Starter', '12 Oct 2023', .05, true)],
    files: [file('Architecture review', 8, 'employment')],
    projects: [proj('SSO Rollout', '22 Mar 2024', .7)] },

  { id: 'anna-henry', name: 'Anna Henry', role: 'VP of Sales', title: 'VP of Sales',
    org: 'HubSpot', phone: '(617) 554-9083', email: 'Annahenry@gmail.com', owner: 'Clampett CEO',
    related: [['aaron-rodd', 'Friend'], ['beth-simpson', 'Colleague'], ['charles-lynch', 'Colleague']],
    orgs: [['hubspot', '2 years', 'VP of Sales'], ['arkham', '5 month', 'Advisor']],
    notes: { projects: [note('Pipeline review', true, '40m'), note('Introduce Anna to the Arkham team')],
             personal: [note('Loves trail running')], team: [] },
    opps: [opp('hubspot', 'Sales Hub Enterprise', '15 Mar 2024', .6)],
    files: [file('Commission plan', 3, 'insurance'), file('NDA', 2, 'employment')],
    projects: [] },

  { id: 'beth-simpson', name: 'Beth Simpson', role: 'Sales Professional', title: 'Sales Professional',
    org: 'Clampett Oil', phone: '(209) 641-7720', email: 'Bethsimpson@gmail.com', owner: 'Aaron Rodd',
    related: [['anna-henry', 'Colleague'], ['aaron-rodd', 'Manager']],
    orgs: [['clampett', '1 year', 'Sales Professional']],
    notes: { projects: [note('Call back about the Fresno lead', true, '2d')], personal: [], team: [] },
    opps: [opp('clampett', 'Fleet Fuel Cards', '04 Feb 2024', .35)],
    files: [file('Offer letter', 2, 'employment')],
    projects: [] },

  { id: 'brian-warren', name: 'Brian Warren', role: 'Manager', title: 'Studio Manager',
    org: 'Arkham Studio', phone: '(503) 277-6104', email: 'Brianwarren@gmail.com', owner: 'Clampett CEO',
    related: [['andrew-marshall', 'Colleague'], ['carlos-jackson', 'Colleague']],
    orgs: [['arkham', '2 years', 'Manager']],
    notes: { projects: [note('Arkham kickoff call', true, '1h'), note('Collect brand assets from Brian')], personal: [], team: [] },
    opps: [opp('arkham', 'Studio Licence', '22 Dec 2023', .9)],
    files: [file('Brand guidelines', 12, 'insurance')],
    projects: [proj('Arkham Rebrand', '01 Mar 2024', .55)] },

  { id: 'carlos-jackson', name: 'Carlos Jackson', role: 'Manager', title: 'Leasing Manager',
    org: 'Northwind Realty', phone: '(415) 908-3346', email: 'Carlosjackson@gmail.com', owner: 'Aaron Rodd',
    related: [['brian-warren', 'Colleague'], ['carlos-montgomery', 'Cousin']],
    orgs: [['northwind', '7 month', 'Manager']],
    notes: { projects: [note('Site visit at Pier 39', true, '6h')], personal: [note('Two kids, ask about soccer')], team: [] },
    opps: [], files: [], projects: [] },

  { id: 'carlos-montgomery', name: 'Carlos Montgomery', role: 'VP of Sales', title: 'VP of Sales',
    org: 'Bluestone Capital', phone: '(646) 771-2039', email: 'Carlosmontgomery@gmail.com', owner: 'Clampett CEO',
    related: [['alyssa-andrade', 'Partner'], ['carlos-jackson', 'Cousin'], ['charles-cox', 'Colleague']],
    orgs: [['bluestone', '5 years', 'VP of Sales'], ['salesforce', '2 years', 'Client']],
    notes: { projects: [note('Renewal negotiation', true, '4h'), note('Send the discount matrix')], personal: [], team: [] },
    opps: [opp('salesforce', 'Enterprise Renewal', '11 May 2024', .5), opp('bluestone', 'Advisory Seats', '03 Sep 2023', .08, true)],
    files: [file('Renewal quote', 2, 'insurance')],
    projects: [proj('Bluestone Renewal', '11 May 2024', .3)] },

  { id: 'carolyn-weaver', name: 'Carolyn Weaver', role: 'Facility Manager', title: 'Facility Manager',
    org: 'Clampett Oil', phone: '(209) 330-8455', email: 'Carolynweaver@gmail.com', owner: 'Aaron Rodd',
    related: [['andrew-marshall', 'Friend'], ['diana-vasquez', 'Colleague']],
    orgs: [['clampett', '3 years', 'Facility Manager']],
    notes: { projects: [note('HVAC inspection booked', true, '1d'), note('Order new access badges')], personal: [], team: [] },
    opps: [],
    files: [file('Maintenance contract', 4, 'insurance'), file('Floor plan', 1, 'employment')],
    projects: [] },

  { id: 'charles-cox', name: 'Charles Cox', role: 'Director', title: 'Director of Strategy',
    org: 'Vertex Labs', phone: '(312) 667-1180', email: 'Charlescox@gmail.com', owner: 'Clampett CEO',
    related: [['carlos-montgomery', 'Colleague'], ['angas-reid', 'Colleague']],
    orgs: [['vertex', '1 year', 'Director'], ['hubspot', '3 years', 'Client']],
    notes: { projects: [note('Strategy offsite agenda', true, '3d')], personal: [], team: [] },
    opps: [opp('vertex', 'Analytics Expansion', '27 Feb 2024', .65)],
    files: [file('Strategy deck', 18, 'employment')],
    projects: [proj('Offsite 2024', '18 Jun 2024', .15)] },

  { id: 'charles-lynch', name: 'Charles Lynch', role: 'Sales Manager', title: 'Sales Manager',
    org: 'Salesforce', phone: '(209) 845-2207', email: 'Charleslynch@gmail.com', owner: 'Aaron Rodd',
    related: [['aaron-rodd', 'Client'], ['anna-henry', 'Colleague']],
    orgs: [['salesforce', '6 years', 'Sales Manager']],
    notes: { projects: [note('Book the venue for the partner summit', true, '30m'), note('Confirm catering numbers')], personal: [], team: [] },
    opps: [opp('salesforce', 'Partner Summit Sponsorship', '19 Apr 2024', .4)],
    files: [file('Venue contract', 3, 'insurance')],
    projects: [] },

  { id: 'christina-little', name: 'Christina Little', role: 'Finance Director', title: 'Finance Director',
    org: 'Bluestone Capital', phone: '(646) 228-5501', email: 'Christinalittle@gmail.com', owner: 'Clampett CEO',
    related: [['aaron-rodd', 'Brother'], ['diana-vasquez', 'Friend']],
    orgs: [['bluestone', '2 years', 'Finance Director']],
    notes: { projects: [note('Approve the Q1 invoices', true, '2h')], personal: [note('Family dinner on Sundays')], team: [] },
    opps: [],
    files: [file('Invoice #2041', 1, 'insurance'), file('Audit report', 9, 'employment')],
    projects: [] },

  { id: 'cyrus-alberson', name: 'Cyrus Alberson', role: 'Employee', title: 'Software Engineer',
    org: 'Vertex Labs', phone: '(312) 412-9935', email: 'Cyrusalberson@gmail.com', owner: 'Aaron Rodd',
    related: [['alexander-reid', 'Colleague'], ['angas-reid', 'Manager']],
    orgs: [['vertex', '8 month', 'Employee']],
    notes: { projects: [note('Onboarding checklist', true, '1w')], personal: [], team: [] },
    opps: [],
    files: [file('Employment contract', 2, 'employment')],
    projects: [] },

  { id: 'diana-vasquez', name: 'Diana Vasquez', role: 'Manager', title: 'Marketing Manager',
    org: 'HubSpot', phone: '(617) 303-6612', email: 'Dianavasquez@gmail.com', owner: 'Clampett CEO',
    related: [['alyssa-andrade', 'Friend'], ['christina-little', 'Friend'], ['carolyn-weaver', 'Colleague']],
    orgs: [['hubspot', '1 year', 'Manager']],
    notes: { projects: [note('Campaign retro', true, '1h'), note('Share the webinar recording')], personal: [], team: [] },
    opps: [opp('hubspot', 'Webinar Bundle', '08 Mar 2024', .25)],
    files: [file('Campaign brief', 4, 'employment')],
    projects: [] },
];

/* Used by the "+" in the dock: a ready-made person for the add-contact demo. */
const NEW_CONTACT_TEMPLATE = { id: 'olivia-bennett', name: 'Olivia Bennett', role: 'Account Executive', title: 'Account Executive',
  org: 'Northwind Realty', phone: '(415) 662-0148', email: 'Oliviabennett@gmail.com', owner: 'Malik Jordan',
  related: [], orgs: [['northwind', 'new', 'Account Executive']],
  notes: { projects: [], personal: [], team: [] }, opps: [], files: [], projects: [] };

const PERSONAL_TAGS = ['Friend', 'Sister', 'Brother', 'Cousin', 'Partner'];
const TAG_CYCLE = ['Colleague', 'Friend', 'Partner', 'Client', 'Event Producer', 'Manager', 'Sister', 'Brother'];

/* Max per metric for the little green bars in the stat cards (tuned so Aaron's bars match the shot). */
const STAT_MAX = { contacts: 18, opps: 30, projects: 20, orgs: 30, notes: 24, files: 32 };
