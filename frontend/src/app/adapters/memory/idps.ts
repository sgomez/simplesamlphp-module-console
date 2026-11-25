import type { EntityRow } from '../../../domain/entities';
import { row, warning } from './rows';

// The six identity providers the Sidebar board counts; no list board shows them.
export const idpRows: EntityRow[] = [
  row('https://idp.alumni.example.org/idp/shibboleth', { name: 'Alumni association' }),
  row('https://login.hospital.example.org/adfs/services/trust', {
    name: 'Clinical partner',
    labels: [warning('Certificate expires in 20 days', 'The signing certificate expires on 15 December 2026.')],
  }),
  row('https://sso.library-consortium.example.net/idp', { name: 'Library consortium', state: 'Modified' }),
  row('https://idp.partner.example.org/idp/shibboleth', { name: 'Partner university' }),
  row('https://login.research.example.net/saml2/idp/metadata.php', { name: 'Research institute', state: 'Unpublished' }),
  row('https://idp.summer-school.example.org/saml2/idp/metadata.php', { name: 'Summer school' }),
];

// The node's own identity provider.
export const hostedRows: EntityRow[] = [row('https://login.example.edu/simplesaml/module.php/saml/idp/metadata', { name: 'University login' })];
