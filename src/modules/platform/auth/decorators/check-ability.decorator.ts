import { SetMetadata } from '@nestjs/common';
import { Action } from '../casl/casl-ability.factory';

export interface RequiredRule {
  action: Action;
  subject: any;
  field?: string;
}

export interface AbilityCheck {
  rules: RequiredRule[];
  operator?: 'AND' | 'OR'; // Default: 'AND' - all rules must pass
}

export const CHECK_ABILITY_KEY = 'check_ability';

/**
 * Decorator to check CASL abilities for an endpoint
 * @param requirements The ability requirements to check (all must pass)
 */
export const CheckAbility = (...requirements: RequiredRule[]) => {
  const check: AbilityCheck = {
    rules: requirements,
    operator: 'AND'
  };
  return SetMetadata(CHECK_ABILITY_KEY, check);
};

/**
 * Decorator to check abilities where ANY requirement can pass
 * @param requirements The ability requirements to check (any can pass)
 */
export const CheckAnyAbility = (...requirements: RequiredRule[]) => {
  const check: AbilityCheck = {
    rules: requirements,
    operator: 'OR'
  };
  return SetMetadata(CHECK_ABILITY_KEY, check);
};

/**
 * Advanced decorator for complex ability checks
 * @param check The ability check configuration
 */
export const CheckAbilities = (check: AbilityCheck) => {
  return SetMetadata(CHECK_ABILITY_KEY, check);
};
