import { Field, Poseidon, PublicKey } from 'o1js';

export class HelperUtils {
  /**
   * @param playerAddress
   * @returns playerid computed from playerAddress
   */
  static getPlayerIdFromAddress(playerAddress: PublicKey): Field {
    return Poseidon.hash(playerAddress.toFields());
  }
}