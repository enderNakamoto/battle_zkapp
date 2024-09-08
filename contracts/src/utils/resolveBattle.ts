import { Field, Poseidon, Provable } from 'o1js';

import { Army, CastleDetails } from '../lib/models';
import { Consts } from "../lib/consts";
import { Errors } from "../lib/errors";

export class ResolveBattleUtils{


  static verifyDefendingArmyHash(
    castle: CastleDetails,
    defendingArmy: Army
) {
    const storedHash = castle.defendingArmyHash;
    const computedHash = Poseidon.hash(Army.toFields(defendingArmy));;
    storedHash.assertEquals(computedHash, Errors.DEFENSE_MISTMATCH);
  }  

  static calculateWinner(
    weather: Field,
    attackingFaction: Field,
    defendingFaction: Field,
    attackingArmy: Army,
    defendingArmy: Army
  ): Field {
    const attackingArmyTotalCost = attackingArmy.totalCost();
    const defendingArmyTotalCost = defendingArmy.totalCost();

    const weatherDefenseModifier = Provable.if(
        weather.equals(Consts.RAINY),
        Consts.DEFENSE_MODIFIER_RAINY,
        Consts.DEFENSE_MODIFIER_SUNNY
    )

    const defenderIsHuman = defendingFaction.equals(Consts.HUMANS);
    const defenderIsElf = defendingFaction.equals(Consts.ELVES);
    const defenderIsDwarf = defendingFaction.equals(Consts.DWARVES);

    const attackerIsHuman = attackingFaction.equals(Consts.HUMANS);
    const attackerIsElf = attackingFaction.equals(Consts.ELVES);
    const attackerIsDwarf = attackingFaction.equals(Consts.DWARVES);

    const defenseFactionModifier = Provable.switch(
        [defenderIsHuman, defenderIsElf, defenderIsDwarf],
        Field, 
        [
            Consts.DEFENSE_MODIFIER_HUMANS,
            Consts.DEFENSE_MODIFIER_ELVES,
            Consts.DEFENSE_MODIFIER_DWARVES
        ]
    )

    const attackFactionModifier = Provable.switch(
        [attackerIsHuman, attackerIsElf, attackerIsDwarf],
        Field, 
        [
            Consts.ATTACK_MODIFIER_HUMANS,
            Consts.ATTACK_MODIFIER_ELVES,
            Consts.ATTACK_MODIFIER_DWARVES
        ]
    )

    const effectiveDefense = defendingArmyTotalCost.mul(defenseFactionModifier).mul(weatherDefenseModifier);
    const effectiveAttack = attackingArmyTotalCost.mul(attackFactionModifier);

    const didDefenderWin = effectiveDefense.greaterThan(effectiveAttack);
    const winner = Provable.if(didDefenderWin, Field(1), Field(0));
    return winner;
  }

}