import {
    Field,
    SmartContract,
    state,
    State,
    method,
    Experimental,
    MerkleMapWitness,
    Poseidon,
    Provable,
  } from 'o1js';

import { Consts } from './lib/consts';
import { Errors } from './lib/errors';
import { CastleDetails, Army } from './lib/models'; 

import { ResolveBattleUtils } from './utils/resolveBattle';
import { InitiateCastleUtils } from './utils/initiateCastle';
import { HelperUtils } from './utils/common';

/** 
 * OffChain State setup
*/
const { OffchainState, OffchainStateCommitments } = Experimental;
const offchainState = OffchainState({
    castles: OffchainState.Map(Field, CastleDetails), // map is (playerId -> CastleDetails)
    ownership: OffchainState.Map(Field, Field), // map is (castleIndex -> playerId)
    underAttack: OffchainState.Map(Field, Field), // map is (castleIndex -> Field(0 or 1))
    defenseSet: OffchainState.Map(Field, Field), // map is (castleIndex -> Field(0 or 1))
    isAttacking: OffchainState.Map(Field, Field), // map is (castleIndex -> Field(0 or 1))
});
class StateProof extends offchainState.Proof {}


/**
 * ZK APP OF THE GAME 
 */
export class Battle extends SmartContract {

  /**
   * STATE VARIABLES - ONCHAIN
   */
  @state(Field) numberOfCastles = State<Field>(); // Number of initalized castles
  @state(Field) numberOfAttacks = State<Field>(); // Sender
  @state(Field) currentWeather = State<Field>(); // Current weather
  @state(Field) playerNullifierRoot = State<Field>(); // Player nullifier MerkleMap root (playerAddress -> boolean)

  /** 
     * STATE VARIABLE - INTERNAL FOR OFFCHAIN COMMITMENTS
  */
  @state(OffchainStateCommitments) offchainState = State(OffchainStateCommitments.empty());

  /**
   * CONSTRUCTOR
   */
  init() {
    this.numberOfCastles.set(Consts.EMPTY_FIELD);
    this.numberOfAttacks.set(Consts.EMPTY_FIELD);
    this.currentWeather.set(Consts.EMPTY_FIELD);
    this.playerNullifierRoot.set(Consts.EMPTY_MAP_ROOT);
  }

  /**
   * METHODS
   */


  @method async initiateCastle( 
    faction: Field,
    playerNullifierWitness: MerkleMapWitness
  ) {

    // make sure the castle is not already initialized
    const sender = this.sender.getAndRequireSignatureV2();
    const playerId = HelperUtils.getPlayerIdFromAddress(sender);
    const playerNullifierRoot = this.playerNullifierRoot.getAndRequireEquals();
    InitiateCastleUtils.verifyPlayerHasNoPlanet(
      playerId,
      playerNullifierRoot,
      playerNullifierWitness
    );

    // make sure the faction is valid
    InitiateCastleUtils.verifyFaction(faction);

    // build the castle - offchain storage
    // 1. set the castle as not defended
    // 2. set the castle as not attacked
    // 3. set the ownership of the castle
    // 4. create and the castle details
    const numCastles = this.numberOfCastles.getAndRequireEquals();
    const castleIndex = numCastles.add(Field(1));

    offchainState.fields.defenseSet.overwrite(castleIndex, Consts.EMPTY_FIELD);
    offchainState.fields.underAttack.overwrite(castleIndex, Consts.EMPTY_FIELD);
    offchainState.fields.isAttacking.overwrite(castleIndex, Consts.EMPTY_FIELD);
    offchainState.fields.ownership.overwrite(castleIndex, playerId);

    const castleDetails = Consts.EMPTY_CASTLE;
    castleDetails.index = castleIndex;
    castleDetails.faction = faction;
    offchainState.fields.castles.overwrite(playerId, castleDetails);

    // build the castle - onchain storage
    // 1. update the player nullifier root
    // 2. increment the number of castles
    const [updatedPlayerRoot, updatedPlayerKey] =
      playerNullifierWitness.computeRootAndKeyV2(Consts.FILLED_FIELD);
    this.playerNullifierRoot.set(updatedPlayerRoot);

    this.numberOfCastles.set(numCastles.add(Field(1)));
  }

  @method async setDefense(
    castleIndex: Field,
    defendingArmy: Army
  ) {
    // verify the ownership of the castle
    const sender = this.sender.getAndRequireSignatureV2();
    const playerId = HelperUtils.getPlayerIdFromAddress(sender);
    const ownerOption = await offchainState.fields.ownership.get(castleIndex);
    const owner = ownerOption.orElse(Consts.EMPTY_FIELD);
    playerId.assertEquals(owner, Errors.NOT_OWNER);

    // verify that the castle is not under attack
    const isUnderAttackOption = await offchainState.fields.underAttack.get(castleIndex);
    const isUnderAttack = isUnderAttackOption.orElse(Consts.EMPTY_FIELD);
    isUnderAttack.assertEquals(Consts.EMPTY_FIELD, Errors.CASTLE_UNDER_ATTACK);

    // verify the cost of the defense
    const totalCost = defendingArmy.totalCost();
    totalCost.assertLessThanOrEqual(Consts.MAX_DEFENSE_COST, Errors.CASTLE_DEFENSE_COST);

    // update the defense
    offchainState.fields.defenseSet.overwrite(castleIndex, Consts.FILLED_FIELD);
    const castleDetailsOption = await offchainState.fields.castles.get(playerId);
    const castleDetails = castleDetailsOption.orElse(Consts.EMPTY_CASTLE);
    const defenseHash = Poseidon.hash(Army.toFields(defendingArmy));
    castleDetails.defendingArmyHash = defenseHash;
    offchainState.fields.castles.overwrite(playerId, castleDetails);

    // set defense set offchain
    offchainState.fields.defenseSet.overwrite(castleIndex, Consts.FILLED_FIELD);
  }

  @method async setAttack(
    targetIndex: Field,
    attackingArmy: Army
  ) {
    // verify the sender owns a castle
    const sender = this.sender.getAndRequireSignatureV2();
    const playerId = HelperUtils.getPlayerIdFromAddress(sender);
    const castleDetailsOption = await offchainState.fields.castles.get(playerId);
    const castleDetails = castleDetailsOption.orElse(Consts.EMPTY_CASTLE);
    const castleIndex = castleDetails.index;
    castleIndex.assertGreaterThan(Consts.EMPTY_FIELD, Errors.NO_CASTLE);

    // verify the sender's castle is defended
    const isDefendedOption = await offchainState.fields.defenseSet.get(castleIndex);
    const isDefended = isDefendedOption.orElse(Consts.EMPTY_FIELD);
    isDefended.assertEquals(Consts.FILLED_FIELD, Errors.CASTLE_NOT_DEFENDED);

    // verify the sender's castle is not already attacking
    const isAttackingOption = await offchainState.fields.isAttacking.get(castleIndex);
    const isAttacking = isAttackingOption.orElse(Consts.EMPTY_FIELD);
    isAttacking.assertEquals(Consts.EMPTY_FIELD, Errors.ALREADY_ATTACKING);

    // verify the cost of the attack
    const totalCost = attackingArmy.totalCost();
    totalCost.assertLessThanOrEqual(Consts.MAX_ATTACK_COST, Errors.ATTACK_COST);

    // make sure the target castle has defense
    const isDefendedTargetOption = await offchainState.fields.defenseSet.get(targetIndex);
    const isDefendedTarget = isDefendedTargetOption.orElse(Consts.EMPTY_FIELD);
    isDefendedTarget.assertEquals(Consts.FILLED_FIELD, Errors.CASTLE_NOT_DEFENDED);

    // make sure the target castle is not already under attack
    const isUnderAttackOption = await offchainState.fields.underAttack.get(targetIndex);
    const isUnderAttack = isUnderAttackOption.orElse(Consts.EMPTY_FIELD);
    isUnderAttack.assertEquals(Consts.EMPTY_FIELD, Errors.CASTLE_UNDER_ATTACK);

    // set the attack offchain
    offchainState.fields.isAttacking.overwrite(castleIndex, Consts.FILLED_FIELD);
    offchainState.fields.underAttack.overwrite(targetIndex, Consts.FILLED_FIELD);
    const targetCastleDetailsOption = await offchainState.fields.castles.get(targetIndex);
    const targetCastleDetails = targetCastleDetailsOption.orElse(Consts.EMPTY_CASTLE);
    targetCastleDetails.attackingArmy = attackingArmy;
    targetCastleDetails.attackerIndex = playerId;
    offchainState.fields.castles.overwrite(targetIndex, targetCastleDetails);

    // increment the number of attacks
    const numAttacks = this.numberOfAttacks.getAndRequireEquals();
    this.numberOfAttacks.set(numAttacks.add(Field(1)));
  }

  @method async updateWeather(
    weather: Field
  ) {
    // ensure the weather is valid
    weather.assertLessThanOrEqual(Consts.RAINY, Errors.INVALID_WEATHER);

    // ensure the sender is authorized to update the weather
    const sender = this.sender.getAndRequireSignatureV2();
    const senderId = HelperUtils.getPlayerIdFromAddress(sender);

    const WeathermanId = HelperUtils.getPlayerIdFromAddress(Consts.WEATHERMAN);
    senderId.assertEquals(WeathermanId, Errors.NOT_AUTHORIZED);


    // update the weather
    this.currentWeather.set(weather);
  }

  @method async resolveBattle(
    defendingArmy: Army,
    targetIndex: Field,
  ){
    // verify the sender owns the castle that is being resolved
    const sender = this.sender.getAndRequireSignatureV2();
    const playerId = HelperUtils.getPlayerIdFromAddress(sender);
    const targetOwnershipOption = await offchainState.fields.ownership.get(targetIndex);
    const targetOwnership = targetOwnershipOption.orElse(Consts.EMPTY_FIELD);
    playerId.assertEquals(targetOwnership, Errors.NOT_OWNER);

    // verify that the castle is under attack
    const targetCastleDetailsOption = await offchainState.fields.castles.get(targetIndex);
    const targetCastleDetails = targetCastleDetailsOption.orElse(Consts.EMPTY_CASTLE);
    const attackingArmy = targetCastleDetails.attackingArmy;
    const attackingArmyCost = attackingArmy.totalCost();
    attackingArmyCost.assertGreaterThan(Field(0), Errors.NO_ATTACK_SET);

    // verify the defense used to resolve the battle
    ResolveBattleUtils.verifyDefendingArmyHash(
      targetCastleDetails,
      defendingArmy
    );
    
    // calculate battle 
    const attackerId = targetCastleDetails.attackerIndex;
    const attackingCastleDetailsOption = await offchainState.fields.castles.get(attackerId);
    const attackingCastleDetails = attackingCastleDetailsOption.orElse(Consts.EMPTY_CASTLE);
    const attackingFaction = attackingCastleDetails.faction;

    const weather = this.currentWeather.getAndRequireEquals();
    const defendingFaction = targetCastleDetails.faction;
    
    const didDefenderWin = ResolveBattleUtils.calculateWinner(
      weather,
      attackingFaction,
      defendingFaction,
      attackingArmy,
      defendingArmy
    );

    const NewDefendedDelta = Provable.if(
        didDefenderWin.equals(Field(1)), 
        Consts.FILLED_FIELD, 
        Consts.EMPTY_FIELD
    );

    const NewPlunderedDelta = Provable.if(
        didDefenderWin.equals(Field(1)), 
        Consts.EMPTY_FIELD, 
        Consts.FILLED_FIELD
    );

    const NewAttacksWonDelta = Provable.if(
        didDefenderWin.equals(Field(1)), 
        Consts.EMPTY_FIELD, 
        Consts.FILLED_FIELD
    );

    const NewAttacksLostDelta = Provable.if(
        didDefenderWin.equals(Field(1)), 
        Consts.FILLED_FIELD, 
        Consts.EMPTY_FIELD
    );

    // update the castle details - points and reset the attack
    targetCastleDetails.defended = targetCastleDetails.defended.add(NewDefendedDelta);
    targetCastleDetails.plundered = targetCastleDetails.plundered.add(NewPlunderedDelta);
    targetCastleDetails.attackerIndex = Consts.EMPTY_FIELD;
    targetCastleDetails.attackingArmy = Consts.EMPTY_ARMY;

    offchainState.fields.castles.overwrite(targetIndex, targetCastleDetails);
    offchainState.fields.underAttack.overwrite(targetIndex, Consts.EMPTY_FIELD);

    attackingCastleDetails.attacksWon = attackingCastleDetails.attacksWon.add(NewAttacksWonDelta);
    attackingCastleDetails.attacksLost = attackingCastleDetails.attacksLost.add(NewAttacksLostDelta);

    offchainState.fields.castles.overwrite(attackerId, attackingCastleDetails);
    offchainState.fields.isAttacking.overwrite(attackerId, Consts.EMPTY_FIELD);

    // increment the number of attacks
    const numAttacks = this.numberOfAttacks.getAndRequireEquals();
    this.numberOfAttacks.set(numAttacks.sub(Field(1)));
  }   
}