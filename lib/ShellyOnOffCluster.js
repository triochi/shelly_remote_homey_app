'use strict';

const { OnOffCluster, ZCLDataTypes } = require('zigbee-clusters');

/**
 * Shelly manufacturer code (0x1002 = 4098).
 */
const SHELLY_MFG_CODE = 0x1002;

/**
 * Custom On/Off cluster extension for Shelly BLU Remote Control ZB.
 *
 * When the device is in custom command mode (shellyCommandMode = 1), it sends
 * manufacturer-specific On/Off/Toggle commands that include a `buttonIndex`
 * (uint8) in the payload. This allows identifying which button was pressed
 * when all buttons groupcast to group 0.
 *
 * The mfg-specific flag in the ZCL frame control separates these from the
 * standard commands even though the command IDs are the same.
 *
 * Standard commands (no payload):
 *   0x00  setOff
 *   0x01  setOn
 *   0x02  toggle
 *
 * Manufacturer-specific commands (mfgCode 0x1002, same IDs):
 *   0x00  shellySetOffWithButton   { buttonIndex: uint8 }
 *   0x01  shellySetOnWithButton    { buttonIndex: uint8 }
 *   0x02  shellyToggleWithButton   { buttonIndex: uint8 }
 */
class ShellyOnOffCluster extends OnOffCluster {

  static get COMMANDS() {
    return {
      ...super.COMMANDS,
      shellySetOffWithButton: {
        id: 0x00,
        manufacturerId: SHELLY_MFG_CODE,
        args: {
          buttonIndex: ZCLDataTypes.uint8,
        },
      },
      shellySetOnWithButton: {
        id: 0x01,
        manufacturerId: SHELLY_MFG_CODE,
        args: {
          buttonIndex: ZCLDataTypes.uint8,
        },
      },
      shellyToggleWithButton: {
        id: 0x02,
        manufacturerId: SHELLY_MFG_CODE,
        args: {
          buttonIndex: ZCLDataTypes.uint8,
        },
      },
    };
  }

}

module.exports = ShellyOnOffCluster;
