import { Struct, Field } from 'o1js';
import { Consts } from './consts';

export class Army extends Struct({
    archers: Field,
    cavalry: Field,
    infantry: Field,
}){
  totalCost(){
    const archersCost = this.archers.mul(Consts.ARCHER_COST);
    const cavalryCost = this.cavalry.mul(Consts.CAVALRY_COST);
    const infantryCost = this.infantry.mul(Consts.FOOT_SOLDIER_COST);
    const totalCost = archersCost.add(cavalryCost).add(infantryCost);
    return totalCost;
  };
};

export class CastleDetails extends Struct({
  index: Field,
  faction: Field,
  defended: Field,
  plundered: Field,
  attacksWon: Field,
  attacksLost: Field,
  attackerIndex: Field,
  attackingArmy: Army,
  defendingArmyHash: Field,
}) {}
