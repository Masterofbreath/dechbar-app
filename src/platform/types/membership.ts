export type MembershipPlan = 'ZDARMA' | 'STUDIO' | 'PRO';
export type MembershipStatus = 'active' | 'cancelled' | 'expired';
export type PurchaseType = 'lifetime' | 'subscription';

export interface Membership {
  id: string;
  user_id: string;
  plan: MembershipPlan;
  status: MembershipStatus;
  type: PurchaseType;
  purchased_at: string;
  expires_at?: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface Module {
  id: string;
  name: string;
  description: string;
  price_czk: number;
  price_type: 'lifetime' | 'subscription';
  is_active: boolean;
  requires_module_id?: string;
}

export interface UserModule {
  id: string;
  user_id: string;
  module_id: string;
  purchased_at: string;
  purchase_type: PurchaseType;
  subscription_status?: 'active' | 'cancelled' | 'past_due';
  current_period_end?: string;
  payment_id?: string;
}
