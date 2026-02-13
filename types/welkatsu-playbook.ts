/**
 * ウエル活当日攻略 playbook の content_json 構造
 */

export type WelkatsuPhaseKey = 'BeforeStore' | 'InStore' | 'AfterStore';

export interface WelkatsuPhaseItem {
  key: WelkatsuPhaseKey;
  title: string;
  steps: string[];
}

export interface WelkatsuTimelineSlot {
  label: string;
  description: string;
  tips?: string[];
}

export interface WelkatsuRegisterStep {
  order: number;
  label: string;
  detail: string;
}

export interface WelkatsuPitfall {
  title: string;
  description: string;
  severity?: 'warning' | 'error' | 'info';
}

export interface WelkatsuPointCalc {
  description: string;
  formula?: string;
  example?: string;
}

export interface WelkatsuPlaybookContentJson {
  phases?: WelkatsuPhaseItem[];
  timeline?: WelkatsuTimelineSlot[];
  register_steps?: WelkatsuRegisterStep[];
  pitfalls?: WelkatsuPitfall[];
  point_calc?: WelkatsuPointCalc;
  checklist_labels?: string[];
}

export interface WelkatsuPlaybookSource {
  url?: string;
  title?: string;
}

export interface WelkatsuPlaybookRow {
  id: string;
  month: string;
  title: string;
  summary: string | null;
  content_json: WelkatsuPlaybookContentJson;
  sources_json: WelkatsuPlaybookSource[] | null;
  created_at: string;
  updated_at: string;
}
