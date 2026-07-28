'use strict';

const { BasicCluster, ZCLDataTypes } = require('zigbee-clusters');

/**
 * Shelly manufacturer code (0x1002 = 4098).
 */
const SHELLY_MFG_CODE = 0x1002;

/**
 * Custom Basic cluster extension for Shelly BLU Remote Control ZB.
 *
 * The remote stores 4 group addresses as manufacturer-specific attributes
 * (mfgCode 0x1002) in the Basic cluster. These group addresses determine
 * which Zigbee groups the remote groupcasts its On/Off and Level Control
 * commands to.
 *
 * Attribute IDs:
 *   0x8000 — group address 1 (default 1)
 *   0x8001 — group address 2 (default 2)
 *   0x8002 — group address 3 (default 3)
 *   0x8003 — group address 4 (default 4)
 */
class ShellyBasicCluster extends BasicCluster {

  static get ATTRIBUTES() {
    return {
      ...super.ATTRIBUTES,
      shellyGroupAddress1: {
        id: 0x8000,
        manufacturerId: SHELLY_MFG_CODE,
        type: ZCLDataTypes.uint16,
      },
      shellyGroupAddress2: {
        id: 0x8001,
        manufacturerId: SHELLY_MFG_CODE,
        type: ZCLDataTypes.uint16,
      },
      shellyGroupAddress3: {
        id: 0x8002,
        manufacturerId: SHELLY_MFG_CODE,
        type: ZCLDataTypes.uint16,
      },
      shellyGroupAddress4: {
        id: 0x8003,
        manufacturerId: SHELLY_MFG_CODE,
        type: ZCLDataTypes.uint16,
      },
    };
  }

}

module.exports = ShellyBasicCluster;
