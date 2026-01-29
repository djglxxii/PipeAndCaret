/**
 * EditorTabs Component
 * 
 * Tab container for Grid View and Tree View
 */

import { Tabs, Paper, Box } from '@mantine/core';
import { useAppStore } from '../app/store';
import { GridView } from './GridView';
import { TreeView } from './TreeView';
import { InspectorPanel } from './InspectorPanel';

export function EditorTabs() {
  const { isParsed, activeTab, setActiveTab } = useAppStore();

  if (!isParsed) {
    return (
      <Paper p="xl" withBorder ta="center" c="dimmed">
        Parse an HL7 message to view and edit its structure.
      </Paper>
    );
  }

  return (
    <Paper withBorder style={{ display: 'flex', flexDirection: 'column', minHeight: '400px' }}>
      <Tabs
        value={activeTab}
        onChange={(value) => setActiveTab(value as 'grid' | 'tree')}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Tabs.List>
          <Tabs.Tab value="grid">Grid View</Tabs.Tab>
          <Tabs.Tab value="tree">Tree View</Tabs.Tab>
        </Tabs.List>

        <Box style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <Tabs.Panel
            value="grid"
            style={{
              flex: 1,
              display: activeTab === 'grid' ? 'flex' : 'none',
              overflow: 'hidden',
            }}
          >
            <Box style={{ flex: 1, overflow: 'hidden' }}>
              <GridView />
            </Box>
          </Tabs.Panel>

          <Tabs.Panel
            value="tree"
            style={{
              flex: 1,
              display: activeTab === 'tree' ? 'flex' : 'none',
              gap: '16px',
              padding: '16px',
              overflow: 'hidden',
            }}
          >
            <Box style={{ flex: 1, overflow: 'auto' }}>
              <TreeView />
            </Box>
            <Box style={{ width: '300px', flexShrink: 0 }}>
              <InspectorPanel />
            </Box>
          </Tabs.Panel>
        </Box>
      </Tabs>
    </Paper>
  );
}
