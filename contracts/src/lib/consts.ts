import { Field, UInt64, MerkleMap, MerkleTree, PublicKey } from 'o1js';
import { CastleDetails, Army } from './models';

const emptyMerkleMap = new MerkleMap();
const emptyMerkleTree12 = new MerkleTree(12);

export namespace Consts {
    // empty values
    export const EMPTY_MAP_ROOT = emptyMerkleMap.getRoot();
    export const EMPTY_TREE_ROOT12 = emptyMerkleTree12.getRoot();
    export const EMPTY_FIELD = Field(0);
    export const EMPTY_ARMY = new Army({
        archers: Consts.EMPTY_FIELD,
        cavalry: Consts.EMPTY_FIELD,
        infantry: Consts.EMPTY_FIELD,
    });
    export const EMPTY_CASTLE = new CastleDetails({
        index: Consts.EMPTY_FIELD,
        faction: Consts.EMPTY_FIELD,
        defended: Consts.EMPTY_FIELD,
        plundered: Consts.EMPTY_FIELD,
        attacksWon: Consts.EMPTY_FIELD,
        attacksLost: Consts.EMPTY_FIELD,
        attackerIndex: Consts.EMPTY_FIELD,
        attackingArmy: Consts.EMPTY_ARMY,
        defendingArmyHash: Consts.EMPTY_FIELD,
      });


    // filled values
    export const FILLED_FIELD = Field(1);

    // faction constants
    export const HUMANS = Field(0);
    export const ELVES = Field(1);
    export const DWARVES = Field(2);

    export const DEFENSE_MODIFIER_HUMANS = Field(100);
    export const DEFENSE_MODIFIER_ELVES = Field(80);
    export const DEFENSE_MODIFIER_DWARVES = Field(130);

    export const ATTACK_MODIFIER_HUMANS = Field(100);
    export const ATTACK_MODIFIER_ELVES = Field(120);
    export const ATTACK_MODIFIER_DWARVES = Field(70);

    // weather constants
    export const SUNNY = Field(0);
    export const RAINY = Field(1);

    export const DEFENSE_MODIFIER_SUNNY = Field(100);
    export const DEFENSE_MODIFIER_RAINY = Field(115);

    export const WEATHERMAN = PublicKey.fromBase58('B62qjxToGLu3bgpmdmNxmhdozJQDEAU4N26pWkWzjDsXbszwqjdaHMo');

    // Unit constants
    export const ARCHER_SPEED = Field(2);
    export const ARCHER_ATTACK = Field(5);
    export const ARCHER_HEALTH = Field(2);
    export const ARCHER_RANGE = Field(100);
    export const ARCHER_COST = Field(100);

    export const CAVALRY_SPEED = Field(20);
    export const CAVALRY_ATTACK = Field(20);
    export const CAVALRY_HEALTH = Field(20);
    export const CAVALRY_RANGE = Field(0);
    export const CAVALRY_COST = Field(500);

    export const FOOT_SOLDIER_SPEED = Field(2);
    export const FOOT_SOLDIER_ATTACK = Field(5);
    export const FOOT_SOLDIER_HEALTH = Field(5);
    export const FOOT_SOLDIER_RANGE = Field(0);
    export const FOOT_SOLDIER_COST = Field(150);

    // Battle constants
    export const BATTLE_INITIAL_DISTANCE = Field(100);
    export const BATTLE_PHASE_MAX_TURNS = Field(100);

    // Defending army constants
    export const MAX_DEFENSE_COST = Field(1000000);

    // attacking army constants
    export const MAX_ATTACK_COST = Field(1000000);
}