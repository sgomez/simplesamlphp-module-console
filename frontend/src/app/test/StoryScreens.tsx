import { useState } from 'react';
import { Route, Routes, useParams, useSearchParams } from 'react-router';
import { AuditPortContext } from '../../domain/audit';
import { AuthsourcesPortContext } from '../../domain/authsources';
import type { EntitySet } from '../../domain/entities';
import { NodesPortContext, type NodeList } from '../../domain/nodes';
import { OverridesPortContext } from '../../domain/overrides';
import { OverviewPortContext } from '../../domain/overview';
import { PastedHold, PastedPortContext, type Held } from '../../domain/pasted';
import { HistoryPortContext } from '../../domain/publication';
import type { Counts } from '../../domain/session';
import type { Failed } from '../../lib/result';
import { memoryAudit, type MemoryAudit } from '../adapters/memory/audit';
import { memoryAuthsources, type MemoryAuthsources } from '../adapters/memory/authsources';
import { memoryEntities, type MemoryEntities } from '../adapters/memory/entities';
import { boardSources } from '../adapters/memory/external';
import { memoryHistory, type MemoryHistory } from '../adapters/memory/history';
import { hostedRows, idpRows } from '../adapters/memory/idps';
import { memoryNodes } from '../adapters/memory/nodes';
import { memoryOverrides, type MemoryOverrides } from '../adapters/memory/overrides';
import { memoryOverview, type MemoryOverview } from '../adapters/memory/overview';
import { memoryPasted, type MemoryPasted } from '../adapters/memory/pasted';
import { boardList } from '../adapters/memory/rows';
import { StoryFrame } from './StoryFrame';
import { StoryMessages } from './StoryMessages';
import { storyRoutes, type StoryRoute } from './storyRoutes';

export interface ScreenPorts {
  history?: MemoryHistory;
  nodes?: { list?: NodeList; failure?: Failed };
  audit?: MemoryAudit;
  overrides?: MemoryOverrides;
  overview?: MemoryOverview;
  authsources?: MemoryAuthsources;
  pasted?: MemoryPasted;
  // What an earlier step read.
  held?: Held | null;
  sets?: Partial<Record<EntitySet, MemoryEntities>>;
  pending?: number;
  counts?: Counts;
}

const SET_ROWS: Record<EntitySet, MemoryEntities> = {
  'saml20-sp-remote': { rows: boardList, counts: { all: 42, 'not-live': 3, warnings: 1 } },
  'saml20-idp-remote': { rows: idpRows },
  'saml20-idp-hosted': { rows: hostedRows },
};

type Ports = ReturnType<typeof portsOf>;

function portsOf({ history, nodes, audit, overrides, overview, authsources, pasted, sets }: ScreenPorts) {
  return {
    history: memoryHistory(history),
    nodes: memoryNodes(nodes),
    audit: memoryAudit(audit),
    overrides: memoryOverrides(overrides),
    overview: memoryOverview(overview),
    authsources: memoryAuthsources(authsources),
    pasted: memoryPasted(pasted),
    sets: {
      'saml20-sp-remote': memoryEntities({ ...SET_ROWS['saml20-sp-remote'], ...sets?.['saml20-sp-remote'] }),
      'saml20-idp-remote': memoryEntities({ ...SET_ROWS['saml20-idp-remote'], ...sets?.['saml20-idp-remote'] }),
      'saml20-idp-hosted': memoryEntities({ ...SET_ROWS['saml20-idp-hosted'], ...sets?.['saml20-idp-hosted'] }),
    },
  };
}

function Screen({ route, ports, pending, counts }: { route: StoryRoute; ports: Ports; pending: number; counts: Counts | undefined }) {
  const [search] = useSearchParams();
  const { set } = useParams();

  return (
    <StoryFrame
      crumbs={route.crumbs(search, set)}
      pending={pending}
      entities={ports.sets[route.set ?? 'saml20-sp-remote']}
      {...(counts === undefined ? {} : { counts })}
    >
      {route.page}
    </StoryFrame>
  );
}

// The screens SPEC specifies that the server does not serve yet, routed among themselves over in-memory ports.
export function StoryScreens({ pending = 7, counts, ...more }: ScreenPorts) {
  const [ports] = useState(() => portsOf(more));
  const [routes] = useState(() => storyRoutes(more.overrides?.sources ?? boardSources));

  return (
    <HistoryPortContext value={ports.history}>
      <NodesPortContext value={ports.nodes}>
        <AuditPortContext value={ports.audit}>
          <OverridesPortContext value={ports.overrides}>
            <OverviewPortContext value={ports.overview}>
              <AuthsourcesPortContext value={ports.authsources}>
                <PastedPortContext value={ports.pasted}>
                  <PastedHold initial={more.held ?? null}>
                    <StoryMessages>
                      <Routes>
                        {routes.map((route) => (
                          <Route key={route.path} path={route.path} element={<Screen route={route} ports={ports} pending={pending} counts={counts} />} />
                        ))}
                      </Routes>
                    </StoryMessages>
                  </PastedHold>
                </PastedPortContext>
              </AuthsourcesPortContext>
            </OverviewPortContext>
          </OverridesPortContext>
        </AuditPortContext>
      </NodesPortContext>
    </HistoryPortContext>
  );
}
