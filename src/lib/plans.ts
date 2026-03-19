import { Plan } from '@/types';

export interface PlanLimits {
  projects: number;
  competitorsPerProject: number;
  scansPerMonth: number;
  retentionMonths: number;
  models: string[];
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  FREE: {
    projects: 1,
    competitorsPerProject: 0,
    scansPerMonth: 2,
    retentionMonths: 1,
    models: ['GPT-4o', 'Copilot'],
  },
  PRO: {
    projects: 5,
    competitorsPerProject: 3,
    scansPerMonth: 10,
    retentionMonths: 12,
    models: ['GPT-4o', 'Claude-3-Sonnet', 'Gemini-1.5-Pro', 'Perplexity'],
  },
  ENTERPRISE: {
    projects: 30,
    competitorsPerProject: 10,
    scansPerMonth: 30,
    retentionMonths: 24,
    models: ['GPT-4o', 'Claude-3-Opus', 'Gemini-1.5-Pro', 'Perplexity', 'Copilot'],
  },
};

export const checkPlanLimit = async (userId: string, type: keyof PlanLimits, supabase: any) => {
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();

  const plan = (profile?.plan as Plan) || 'FREE';
  const limit = PLAN_LIMITS[plan][type];

  if (type === 'projects') {
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    return (count || 0) < limit;
  }

  if (type === 'scansPerMonth') {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('scans')
      .select('*, projects!inner(*)', { count: 'exact', head: true })
      .eq('projects.user_id', userId)
      .gte('created_at', startOfMonth.toISOString());
    return (count || 0) < limit;
  }

  return true;
};
