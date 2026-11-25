import { useState, type ReactNode } from 'react';
import { Route, Routes } from 'react-router';
import { AuditPortContext } from '../../domain/audit';
import { SP_LIST, editPath } from '../../domain/entities';
import { NodesPortContext, type NodeList } from '../../domain/nodes';
import { OverridesPortContext } from '../../domain/overrides';
import { HistoryPortContext } from '../../domain/publication';
import { AuditPage } from '../../pages/AuditPage';
import { HistoryPage } from '../../pages/HistoryPage';
import { NodesPage } from '../../pages/NodesPage';
import { OverridePage } from '../../pages/OverridePage';
import { RollbackPage } from '../../pages/RollbackPage';
import { memoryAudit, type MemoryAudit } from '../adapters/memory/audit';
import { memoryHistory, type MemoryHistory } from '../adapters/memory/history';
import { memoryNodes } from '../adapters/memory/nodes';
import { boardComparison, memoryOverrides, type MemoryOverrides } from '../adapters/memory/overrides';
import type { Failed } from '../../lib/result';
import type { Crumb } from '../Shell';
import { StoryFrame } from './StoryFrame';
import { StoryMessages } from './StoryMessages';

export interface ScreenPorts {
  history?: MemoryHistory;
  nodes?: { list?: NodeList; failure?: Failed };
  audit?: MemoryAudit;
  overrides?: MemoryOverrides;
  pending?: number;
}

const compared = boardComparison.name ?? boardComparison.entityId;

const SCREENS: [string, Crumb[], ReactNode][] = [
  ['/history', [{ label: 'History' }], <HistoryPage key="history" />],
  ['/history/audit', [{ label: 'History' }], <AuditPage key="audit" />],
  ['/history/:n/rollback', [{ label: 'History', to: '/history' }, { label: 'Roll back' }], <RollbackPage key="rollback" />],
  ['/nodes', [{ label: 'Nodes' }], <NodesPage key="nodes" />],
  [
    `${SP_LIST}/override`,
    [{ label: 'Service providers', to: SP_LIST }, { label: compared, to: editPath(boardComparison.entityId) }, { label: 'Compare' }],
    <OverridePage key="override" />,
  ],
];

// The screens SPEC specifies that the server does not serve yet, routed among themselves over in-memory ports.
export function StoryScreens({ pending = 7, history, nodes, audit, overrides }: ScreenPorts) {
  const [ports] = useState(() => ({
    history: memoryHistory(history),
    nodes: memoryNodes(nodes),
    audit: memoryAudit(audit),
    overrides: memoryOverrides(overrides),
  }));

  return (
    <HistoryPortContext value={ports.history}>
      <NodesPortContext value={ports.nodes}>
        <AuditPortContext value={ports.audit}>
          <OverridesPortContext value={ports.overrides}>
            <StoryMessages>
              <Routes>
                {SCREENS.map(([path, crumbs, page]) => (
                  <Route
                    key={path}
                    path={path}
                    element={
                      <StoryFrame crumbs={crumbs} pending={pending}>
                        {page}
                      </StoryFrame>
                    }
                  />
                ))}
              </Routes>
            </StoryMessages>
          </OverridesPortContext>
        </AuditPortContext>
      </NodesPortContext>
    </HistoryPortContext>
  );
}
