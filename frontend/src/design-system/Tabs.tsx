import type { ReactNode } from 'react';
import { Link, Tab, TabList, TabPanel, Tabs as AriaTabs } from 'react-aria-components';

export interface LinkTab {
  key: string;
  label: string;
  to: string;
}

// Views with their own address: a navigation of links, the current one marked.
export function LinkTabs({ label, tabs, current }: { label: string; tabs: readonly LinkTab[]; current: string }) {
  return (
    <nav className="tabs" aria-label={label}>
      {tabs.map(({ key, label: text, to }) => (
        <Link key={key} href={to} {...(key === current ? { 'aria-current': 'page' } : {})}>
          {text}
        </Link>
      ))}
    </nav>
  );
}

export interface PanelTab {
  key: string;
  label: string;
  panel: ReactNode;
}

interface TabsProps {
  label: string;
  tabs: readonly PanelTab[];
  selected: string;
  onSelect: (key: string) => void;
}

export function Tabs({ label, tabs, selected, onSelect }: TabsProps) {
  return (
    <AriaTabs selectedKey={selected} onSelectionChange={(key) => onSelect(String(key))}>
      <TabList className="tabs" aria-label={label}>
        {tabs.map(({ key, label: text }) => (
          <Tab key={key} id={key}>
            {text}
          </Tab>
        ))}
      </TabList>
      {tabs.map(({ key, panel }) => (
        <TabPanel key={key} id={key}>
          {panel}
        </TabPanel>
      ))}
    </AriaTabs>
  );
}
