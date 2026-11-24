import { SpRemote } from '../../../src/Domain/Entity/SpRemote';
import shell from '../../../templates/app.php';
import schema from '../../../docs/spec/schemas/saml20-sp-remote.json';

export const imported = [SpRemote, shell, schema];
