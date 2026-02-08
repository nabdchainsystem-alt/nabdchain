import React from 'react';
import { Tray as Inbox, Stack as Layers, CalendarBlank as Calendar, Hash } from 'phosphor-react';
import { NavItem } from './types';

export const INITIAL_NAV_ITEMS: NavItem[] = [
  { id: '1', label: 'Inbox', type: 'list', icon: <Inbox size={16} /> },
  {
    id: '2',
    label: 'Projects',
    type: 'folder',
    icon: <Layers size={16} />,
    children: [
      { id: '2-1', label: 'Website Redesign', type: 'doc' },
      { id: '2-2', label: 'Q4 Marketing', type: 'doc' },
    ],
  },
  {
    id: '3',
    label: 'Journal',
    type: 'folder',
    icon: <Calendar size={16} />,
    children: [{ id: '3-1', label: 'October 2023', type: 'doc' }],
  },
  {
    id: '4',
    label: 'Resources',
    type: 'folder',
    icon: <Hash size={16} />,
    children: [{ id: '4-1', label: 'Design System', type: 'doc' }],
  },
];
