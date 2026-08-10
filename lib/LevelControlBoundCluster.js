'use strict';

const { BoundCluster } = require('zigbee-clusters');

/**
 * BoundCluster implementation for receiving Level Control commands
 * from the Shelly BLU Remote Control ZB.
 *
 * Handles both standard and manufacturer-specific commands:
 *
 * Standard (command mode 0):
 *   moveToLevel / moveToLevelWithOnOff / stepWithOnOff — no buttonIndex
 *
 * Manufacturer-specific (command mode 1, mfgCode 0x1002):
 *   shellyMoveToLevelWithButton / shellyMoveToLevelWithOnOffAndButton /
 *   shellyStepWithOnOffAndButton
 *   — includes buttonIndex (uint8) appended after standard fields
 */
class LevelControlBoundCluster extends BoundCluster {

  constructor({ onMoveToLevel, onMoveToLevelWithOnOff, onStepWithOnOff }) {
    super();
    this._onMoveToLevel = onMoveToLevel;
    this._onMoveToLevelWithOnOff = onMoveToLevelWithOnOff;
    this._onStepWithOnOff = onStepWithOnOff;
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

  stepWithOnOff(payload, meta) {
    if (typeof this._onStepWithOnOff === 'function') {
      this._onStepWithOnOff({ ...payload, groupId: meta && meta.groupId, buttonIndex: null });
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

  shellyStepWithOnOffAndButton({ stepMode, stepSize, transitionTime, buttonIndex }, meta) {
    if (typeof this._onStepWithOnOff === 'function') {
      this._onStepWithOnOff({ stepMode, stepSize, transitionTime, groupId: meta && meta.groupId, buttonIndex });
    }
  }

}

module.exports = LevelControlBoundCluster;
