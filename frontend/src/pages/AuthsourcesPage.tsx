import { LinkButton } from '../design-system/Button';
import { PlusIcon } from '../design-system/icons';
import { Page } from '../design-system/Page';
import { AUTHSOURCE_NEW, AuthsourceRows, useAuthsources } from '../domain/authsources';

export function AuthsourcesPage() {
  const answer = useAuthsources();

  return (
    <Page>
      <div className="page-head">
        <div className="title-block">
          <div className="title">
            <h1 className="h1">Authsources</h1>
          </div>
        </div>
        <LinkButton variant="primary" to={AUTHSOURCE_NEW}>
          <PlusIcon />
          Add authsource
        </LinkButton>
      </div>
      {answer.state === 'ready' && <AuthsourceRows {...answer.data} />}
    </Page>
  );
}
