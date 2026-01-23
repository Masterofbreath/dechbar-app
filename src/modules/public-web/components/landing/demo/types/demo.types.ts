/**
 * Demo Types
 * 
 * TypeScript interfaces for Interactive Demo Mockup.
 * 
 * @package DechBar_App
 * @subpackage PublicWeb/Demo
 */

import type { Exercise } from '@/shared/exercises/types';

export type DemoView = 'dnes' | 'cvicit';

export interface DemoState {
  activeView: DemoView;
  selectedExercise: Exercise | null;
  isModalOpen: boolean;
}

export interface DemoEvent {
  action: 'tab_switch' | 'exercise_click' | 'modal_open' | 'modal_close' | 'registration_start' | 'registration_complete';
  view?: DemoView;
  exercise?: Exercise;
  method?: 'google' | 'email';
  timestamp: number;
}
