import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { boardNodes, nodeAgo } from '../app/adapters/memory/nodes';
import { renderScreen } from '../app/test/screens';

function node(identifier: string, served: number | null, seconds: number) {
  return { identifier, served, checkedAt: nodeAgo(seconds), hasProblems: false, here: false };
}

describe('Nodes', () => {
  it('marks a node that serves nothing, one ahead of the live Snapshot and one not seen for a day', async () => {
    renderScreen('/nodes', {
      nodes: { list: { ...boardNodes, problems: [], nodes: [node('a', null, 5), node('b', 42, 90), node('c', 41, 2 * 86400)] } },
    });

    expect(await screen.findByText('Serves nothing')).toBeTruthy();
    expect(screen.getByText('Serves #42 · not live')).toBeTruthy();
    expect(screen.getByText('1 min ago')).toBeTruthy();
    expect(screen.getByText('Last checked 2 days ago').previousElementSibling?.className).toBe('status s-warn');
  });

  it('shows every number as served before the first Publication', async () => {
    renderScreen('/nodes', { nodes: { list: { ...boardNodes, current: null, problems: [], nodes: [node('a', 3, 1)] } } });

    expect(await screen.findByText('Serves #3')).toBeTruthy();
  });

  it('says when no node has checked in', async () => {
    renderScreen('/nodes', { nodes: { list: { ...boardNodes, nodes: [] } } });

    expect(await screen.findByRole('heading', { name: 'No node has checked in yet' })).toBeTruthy();
  });

  it('says so when the nodes cannot be loaded', async () => {
    renderScreen('/nodes', { nodes: { failure: { status: 500, body: null } } });

    expect(await screen.findByText('Nodes not loaded: the server answered 500.')).toBeTruthy();
  });
});
