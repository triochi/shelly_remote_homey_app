'use strict';

const { LevelControlCluster, ZCLDataTypes } = require('zigbee-clusters');

/**
 * Shelly manufacturer code (0x1002 = 4098).
 */
const SHELLY_MFG_CODE = 0x1002;

/**
 * Custom Level Control cluster extension for Shelly BLU Remote Control ZB.
 *
 * When the device is in custom command mode (shellyCommandMode = 1), it sends
 * manufacturer-specific MoveToLevel commands that append a `buttonIndex`
 * (uint8) after the standard fields.
 *
 * Standard command:
 *   0x00  moveToLevel  { level: uint8, transitionTime: uint16 }
 *
 * Manufacturer-specific command (mfgCode 0x1002, same ID):
 *   0x00  shellyMoveToLevelWithButton  { level: uint8, transitionTime: uint16, buttonIndex: uint8 }
 */
class ShellyLevelControlCluster extends LevelControlCluster {

  static get COMMANDS() {
    return {
      ...super.COMMANDS,
      shellyMoveToLevelWithButton: {
        id: 0x00,
        manufacturerId: SHELLY_MFG_CODE,
        args: {
          level: ZCLDataTypes.uint8,
          transitionTime: ZCLDataTypes.uint16,
          buttonIndex: ZCLDataTypes.uint8,
        },
      },
      shellyMoveToLevelWithOnOffAndButton: {
        id: 0x04,
        manufacturerId: SHELLY_MFG_CODE,
        args: {
          level: ZCLDataTypes.uint8,
          transitionTime: ZCLDataTypes.uint16,
          buttonIndex: ZCLDataTypes.uint8,
        },
      },
    };
  }

}

module.exports = ShellyLevelControlCluster;
