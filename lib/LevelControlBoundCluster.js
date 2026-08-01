'use strict';

const { BoundCluster } = require('zigbee-clusters');

/**
 * BoundCluster implementation for receiving Level Control commands
 * from the Shelly BLU Remote Control ZB.
 *
 * Handles both standard and manufacturer-specific commands:
 *
 * Standard (command mode 0):
 *   moveToLevel / moveToLevelWithOnOff — no buttonIndex
 *
 * Manufacturer-specific (command mode 1, mfgCode 0x1002):
 *   shellyMoveToLevelWithButton / shellyMoveToLevelWithOnOffAndButton
 *   — includes buttonIndex (uint8) appended after standard fields
 */
class LevelControlBoundCluster extends BoundCluster {

  constructor({ onMoveToLevel, onMoveToLevelWithOnOff }) {
    super();
    this._onMoveToLevel = onMoveToLevel;
    this._onMoveToLevelWithOnOff = onMoveToLevelWithOnOff;
  }

  // --- Standard commands (no button index) ---

  moveToLevel(payload, meta) {
    if (typeof this._onMoveToLevel === 'function') {
      this._onMoveToLevel({ ...payload, groupId: meta && meta.groupId, buttonIndex: null });
    }
  }

  moveToLevelWithOnOff(payload, meta) {
    if (typeof this._onMoveToLevelWithOnOff === 'function') {
      this._onMoveToLevelWithOnOff({ ...payload, groupId: meta && meta.groupId, buttonIndex: null });
    }
  }

  // --- Manufacturer-specific commands (with button index) ---

  shellyMoveToLevelWithButton({ level, transitionTime, buttonIndex }, meta) {
    if (typeof this._onMoveToLevel === 'function') {
      this._onMoveToLevel({ level, transitionTime, groupId: meta && meta.groupId, buttonIndex });
    }
  }

  shellyMoveToLevelWithOnOffAndButton({ level, transitionTime, buttonIndex }, meta) {
    if (typeof this._onMoveToLevelWithOnOff === 'function') {
      this._onMoveToLevelWithOnOff({ level, transitionTime, groupId: meta && meta.groupId, buttonIndex });
    }
  }

}

module.exports = LevelControlBoundCluster;
