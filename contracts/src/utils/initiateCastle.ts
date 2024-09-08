import { Field, MerkleMapWitness } from 'o1js';

import { Consts } from "../lib/consts";
import { Errors } from "../lib/errors";

export class InitiateCastleUtils{

  static verifyFaction(faction: Field) {
    faction.assertLessThanOrEqual(Field(3), 
    Errors.INVALID_FACTION);
  }

  static verifyPlayerHasNoPlanet(
    playerId: Field,
    playerNullifierRoot: Field,
    playerNullifierWitness: MerkleMapWitness
  ) {
    const [derivedPlayerRoot, derivedPlayerKey] =
      playerNullifierWitness.computeRootAndKeyV2(Consts.EMPTY_FIELD);
    derivedPlayerRoot.assertEquals(
      playerNullifierRoot,
      Errors.CASTLE_ALREADY_INITIALIZED
    );
    derivedPlayerKey.assertEquals(playerId, Errors.CASTLE_ALREADY_INITIALIZED);
  }

}