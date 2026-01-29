/**
 * TreeView Component
 * 
 * Hierarchical tree view of HL7 message structure.
 * Shows segments, fields, repeats, components, and subcomponents.
 */

import { useState, useMemo } from 'react';
import { Box, Text, UnstyledButton, Collapse, Stack } from '@mantine/core';
import { useAppStore } from '../app/store';
import type { HL7Path, HL7Message, FieldNode, RepeatNode, ComponentNode } from '../app/types';
import { parseHL7 } from '../hl7';
import { hasFieldChanged, hasLeafChanged } from '../utils/diff';

interface TreeNodeProps {
  label: string;
  path: HL7Path;
  isLeaf?: boolean;
  value?: string;
  isChanged?: boolean;
  children?: React.ReactNode;
  level: number;
}

function TreeNode({ label, path, isLeaf, value, isChanged, children, level }: TreeNodeProps) {
  const [isOpen, setIsOpen] = useState(level < 2);
  const { selectedPath, setSelectedPath } = useAppStore();

  const isSelected = useMemo(() => {
    if (!selectedPath) return false;
    return (
      selectedPath.segmentIndex === path.segmentIndex &&
      selectedPath.fieldIndex === path.fieldIndex &&
      selectedPath.repeatIndex === path.repeatIndex &&
      selectedPath.componentIndex === path.componentIndex &&
      selectedPath.subcomponentIndex === path.subcomponentIndex
    );
  }, [selectedPath, path]);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPath(path);
    if (!isLeaf && children) {
      setIsOpen(!isOpen);
    }
  };

  return (
    <Box>
      <UnstyledButton
        onClick={handleClick}
        style={{
          display: 'block',
          width: '100%',
          padding: '4px 8px',
          paddingLeft: `${level * 16 + 8}px`,
          borderRadius: '4px',
          backgroundColor: isSelected ? 'var(--mantine-color-blue-1)' : 'transparent',
          borderLeft: isChanged ? '3px solid var(--mantine-color-yellow-6)' : '3px solid transparent',
        }}
      >
        <Box style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {!isLeaf && children && (
            <Text size="xs" c="dimmed" style={{ width: '12px' }}>
              {isOpen ? '▼' : '▶'}
            </Text>
          )}
          {(isLeaf || !children) && <Box style={{ width: '12px' }} />}
          
          <Text size="sm" fw={isLeaf ? 400 : 500}>
            {label}
          </Text>
          
          {isLeaf && value !== undefined && (
            <Text
              size="sm"
              c="dimmed"
              style={{
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                flex: 1,
              }}
            >
              = "{value}"
            </Text>
          )}
        </Box>
      </UnstyledButton>

      {!isLeaf && children && (
        <Collapse in={isOpen}>{children}</Collapse>
      )}
    </Box>
  );
}

interface SubcomponentTreeProps {
  segmentIndex: number;
  segmentName: string;
  fieldIndex: number;
  repeatIndex: number;
  componentIndex: number;
  subcomponentIndex: number;
  value: string;
  isChanged: boolean;
  level: number;
}

function SubcomponentTree({
  segmentIndex,
  segmentName: _segmentName,
  fieldIndex,
  repeatIndex,
  componentIndex,
  subcomponentIndex,
  value,
  isChanged,
  level,
}: SubcomponentTreeProps) {
  const path: HL7Path = {
    segmentIndex,
    fieldIndex,
    repeatIndex,
    componentIndex,
    subcomponentIndex,
  };

  return (
    <TreeNode
      label={`Subcomponent ${subcomponentIndex + 1}`}
      path={path}
      isLeaf
      value={value}
      isChanged={isChanged}
      level={level}
    />
  );
}

interface ComponentTreeProps {
  segmentIndex: number;
  segmentName: string;
  fieldIndex: number;
  repeatIndex: number;
  componentIndex: number;
  component: ComponentNode;
  originalMessage: HL7Message | null;
  currentMessage: HL7Message;
  level: number;
}

function ComponentTree({
  segmentIndex,
  segmentName,
  fieldIndex,
  repeatIndex,
  componentIndex,
  component,
  originalMessage,
  currentMessage,
  level,
}: ComponentTreeProps) {
  const path: HL7Path = {
    segmentIndex,
    fieldIndex,
    repeatIndex,
    componentIndex,
  };

  // If only one subcomponent, render it directly
  if (component.subcomponents.length === 1) {
    const isChanged = hasLeafChanged(
      originalMessage,
      currentMessage,
      segmentIndex,
      fieldIndex,
      repeatIndex,
      componentIndex,
      0
    );

    return (
      <TreeNode
        label={`Component ${componentIndex + 1}`}
        path={{ ...path, subcomponentIndex: 0 }}
        isLeaf
        value={component.subcomponents[0].value}
        isChanged={isChanged}
        level={level}
      />
    );
  }

  return (
    <TreeNode label={`Component ${componentIndex + 1}`} path={path} level={level}>
      {component.subcomponents.map((subcomp, subIdx) => {
        const isChanged = hasLeafChanged(
          originalMessage,
          currentMessage,
          segmentIndex,
          fieldIndex,
          repeatIndex,
          componentIndex,
          subIdx
        );

        return (
          <SubcomponentTree
            key={subIdx}
            segmentIndex={segmentIndex}
            segmentName={segmentName}
            fieldIndex={fieldIndex}
            repeatIndex={repeatIndex}
            componentIndex={componentIndex}
            subcomponentIndex={subIdx}
            value={subcomp.value}
            isChanged={isChanged}
            level={level + 1}
          />
        );
      })}
    </TreeNode>
  );
}

interface RepeatTreeProps {
  segmentIndex: number;
  segmentName: string;
  fieldIndex: number;
  repeatIndex: number;
  repeat: RepeatNode;
  originalMessage: HL7Message | null;
  currentMessage: HL7Message;
  level: number;
}

function RepeatTree({
  segmentIndex,
  segmentName,
  fieldIndex,
  repeatIndex,
  repeat,
  originalMessage,
  currentMessage,
  level,
}: RepeatTreeProps) {
  const path: HL7Path = {
    segmentIndex,
    fieldIndex,
    repeatIndex,
  };

  // If only one component with one subcomponent, render as leaf
  if (
    repeat.components.length === 1 &&
    repeat.components[0].subcomponents.length === 1
  ) {
    const isChanged = hasLeafChanged(
      originalMessage,
      currentMessage,
      segmentIndex,
      fieldIndex,
      repeatIndex,
      0,
      0
    );

    return (
      <TreeNode
        label={`Repeat ${repeatIndex + 1}`}
        path={{ ...path, componentIndex: 0, subcomponentIndex: 0 }}
        isLeaf
        value={repeat.components[0].subcomponents[0].value}
        isChanged={isChanged}
        level={level}
      />
    );
  }

  return (
    <TreeNode label={`Repeat ${repeatIndex + 1}`} path={path} level={level}>
      {repeat.components.map((comp, compIdx) => (
        <ComponentTree
          key={compIdx}
          segmentIndex={segmentIndex}
          segmentName={segmentName}
          fieldIndex={fieldIndex}
          repeatIndex={repeatIndex}
          componentIndex={compIdx}
          component={comp}
          originalMessage={originalMessage}
          currentMessage={currentMessage}
          level={level + 1}
        />
      ))}
    </TreeNode>
  );
}

interface FieldTreeProps {
  segmentIndex: number;
  segmentName: string;
  field: FieldNode;
  originalMessage: HL7Message | null;
  currentMessage: HL7Message;
  level: number;
}

function FieldTree({
  segmentIndex,
  segmentName,
  field,
  originalMessage,
  currentMessage,
  level,
}: FieldTreeProps) {
  const fieldIndex = field.index;
  const path: HL7Path = {
    segmentIndex,
    fieldIndex,
  };

  const isFieldChanged = hasFieldChanged(
    originalMessage,
    currentMessage,
    segmentIndex,
    fieldIndex
  );

  // If only one repeat with one component and one subcomponent, render as leaf
  if (
    field.repeats.length === 1 &&
    field.repeats[0].components.length === 1 &&
    field.repeats[0].components[0].subcomponents.length === 1
  ) {
    return (
      <TreeNode
        label={`${segmentName}-${fieldIndex}`}
        path={{ ...path, repeatIndex: 0, componentIndex: 0, subcomponentIndex: 0 }}
        isLeaf
        value={field.repeats[0].components[0].subcomponents[0].value}
        isChanged={isFieldChanged}
        level={level}
      />
    );
  }

  return (
    <TreeNode
      label={`${segmentName}-${fieldIndex}`}
      path={path}
      isChanged={isFieldChanged}
      level={level}
    >
      {field.repeats.map((repeat, repIdx) => (
        <RepeatTree
          key={repIdx}
          segmentIndex={segmentIndex}
          segmentName={segmentName}
          fieldIndex={fieldIndex}
          repeatIndex={repIdx}
          repeat={repeat}
          originalMessage={originalMessage}
          currentMessage={currentMessage}
          level={level + 1}
        />
      ))}
    </TreeNode>
  );
}

export function TreeView() {
  const { message, originalRaw } = useAppStore();

  // Parse original for comparison
  const originalMessage = useMemo(() => {
    if (!originalRaw) return null;
    const result = parseHL7(originalRaw);
    return result.success ? result.message : null;
  }, [originalRaw]);

  if (!message) {
    return <Text c="dimmed">No message parsed.</Text>;
  }

  return (
    <Stack gap={0}>
      {message.segments.map((segment, segIdx) => {
        const path: HL7Path = { segmentIndex: segIdx };

        return (
          <TreeNode
            key={segIdx}
            label={`${segment.name} (${segIdx})`}
            path={path}
            level={0}
          >
            {segment.fields.map((field) => (
              <FieldTree
                key={field.index}
                segmentIndex={segIdx}
                segmentName={segment.name}
                field={field}
                originalMessage={originalMessage}
                currentMessage={message}
                level={1}
              />
            ))}
          </TreeNode>
        );
      })}
    </Stack>
  );
}
