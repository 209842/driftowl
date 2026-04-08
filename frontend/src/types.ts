export type Mode =
  | 'company' | 'startup' | 'platform' | 'supplychain'
  | 'dao' | 'community' | 'government' | 'environment'
  | 'education' | 'healthcare' | 'media' | 'sports'

export interface AgentNode {
  id: string
  name: string
  role: string
  color: string
  analysis: string
  references: string[]
  x?: number
  y?: number
  vx?: number
  vy?: number
  fx?: number | null
  fy?: number | null
}

export interface SynthesisData {
  mechanism_name: string
  core_insight: string
  rules: string[]
  explanation: string
  expected_outcome: string
}

export type AppScreen = 'landing' | 'auth' | 'mode' | 'input' | 'boardroom' | 'settings' | 'library' | 'analysis'
export type BoardroomPhase = 'design' | 'simulation' | 'paper'

export interface Persona {
  id: string
  name: string
  role: string
  personality: string
  initial_stance: 'resistant' | 'neutral' | 'receptive'
  motivation: string
}

export interface AgentAction {
  id: string
  name: string
  role: string
  decision: 'COMPLY' | 'RESIST'
  behavior: string
  round: number
}

export interface RoundSummary {
  round: number
  comply_rate: number
  comply_count: number
  total: number
}

export interface SimulationComplete {
  rounds_data: number[]
  final_comply_rate: number
  peak_comply_rate: number
  trend: 'improving' | 'declining' | 'stable'
  population_size: number
}

export interface PaperSection {
  title: string
  content: string
}

export interface Paper {
  title: string
  authors: string[]
  date: string
  abstract: string
  keywords: string[]
  sections: PaperSection[]
  references: string[]
}
