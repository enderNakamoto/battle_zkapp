export namespace Errors {
    // generic errors
    export const INVALID_KEY = 'Not the correct key';
    export const PLAYER_HAS_NO_ACCESS =
      'This player has no access to this planet';

    // Initiate Castle errors
    export const INVALID_FACTION = 'Invalid faction';
    export const CASTLE_ALREADY_INITIALIZED = 'Castle already initialized';

    // Defending Army errors
    export const NOT_OWNER = 'Not the owner of the castle';
    export const CASTLE_DEFENSE_COST = 'Defending army cost is too high';
    export const CASTLE_UNDER_ATTACK = 'Castle is under attack';

    // Attacking Army errors
    export const NO_CASTLE = 'Does not have a castle';
    export const CASTLE_NOT_DEFENDED = 'Castle is not defended';
    export const ALREADY_ATTACKING = 'Castle is already attacking';
    export const ATTACK_COST = 'Attacking army cost is too high';

    // Calculate Battle errors
    export const NO_ATTACK_SET = 'No attack set';
    export const DEFENSE_MISTMATCH = 'Defense mismatch';
}