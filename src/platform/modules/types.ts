/**
 * Module System Types
 */

export interface Module {
  id: string;
  name: string;
  description: string | null;
  price_czk: number;
  price_type: 'lifetime' | 'subscription';
  is_active: boolean;
  is_beta: boolean;
  requires_module_id: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface UserModule {
  id: string;
  user_id: string;
  module_id: string;
  purchased_at: string;
  purchase_type: 'lifetime' | 'subscription';
  subscription_status: 'active' | 'cancelled' | 'past_due' | null;
  current_period_end: string | null;
  payment_id: string | null;
  payment_provider: 'gopay' | 'stripe' | null;
}

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  pricing: {
    source: 'database';
    table: 'modules';
    id: string;
  };
  dependencies: {
    platform: string[];
    modules: string[];
  };
  api: {
    routes: string[];
    tables: string[];
  };
  permissions: string[];
}
