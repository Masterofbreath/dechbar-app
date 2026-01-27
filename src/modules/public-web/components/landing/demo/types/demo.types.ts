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
  isSettingsOpen: boolean;
  isKPOpen: boolean;
  isEmailModalOpen: boolean;
  kpMeasurementData: { averageKP: number; attempts: number[] } | null;
}

export interface DemoEvent {
  action: 'tab_switch' | 'exercise_click' | 'modal_open' | 'modal_close' | 'registration_start' | 'registration_complete' | 'settings_open' | 'settings_close' | 'kp_measurement_open' | 'kp_measurement_close' | 'kp_measurement_completed' | 'kp_conversion_triggered' | 'email_modal_open' | 'email_modal_close' | 'email_submitted';
  view?: DemoView;
  exercise?: Exercise;
  method?: 'google' | 'email';
  email?: string;
  kpValue?: number;
  attempts?: number;
  timestamp: number;
}
