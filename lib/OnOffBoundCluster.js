'use strict';

const { BoundCluster } = require('zigbee-clusters');

/**
 * BoundCluster implementation for receiving On/Off commands
 * from the Shelly BLU Remote Control ZB.
 *
 * Handles both standard and manufacturer-specific commands:
 *
 * Standard (command mode 0):
 *   setOff / setOn / toggle — no buttonIndex
 *
 * Manufacturer-specific (command mode 1, mfgCode 0x1002):
 *   shellySetOffWithButton / shellySetOnWithButton / shellyToggleWithButton
 *   — includes buttonIndex (uint8)
 */
class OnOffBoundCluster extends BoundCluster {

  constructor({ onSetOn, onSetOff, onToggle }) {
    super();
    this._onSetOn = onSetOn;
    this._onSetOff = onSetOff;
    this._onToggle = onToggle;
  }

  // --- Standard commands (no button index) ---

  setOn(args, meta) {
    if (typeof this._onSetOn === 'function') {
      this._onSetOn({ groupId: meta && meta.groupId, buttonIndex: null });
    }
  }

  setOff(args, meta) {
    if (typeof this._onSetOff === 'function') {
      this._onSetOff({ groupId: meta && meta.groupId, buttonIndex: null });
    }
  }

  toggle(args, meta) {
    if (typeof this._onToggle === 'function') {
      this._onToggle({ groupId: meta && meta.groupId, buttonIndex: null });
    }
  }

  // --- Manufacturer-specific commands (with button index) ---

  shellySetOnWithButton({ buttonIndex }, meta) {
    if (typeof this._onSetOn === 'function') {
      this._onSetOn({ groupId: meta && meta.groupId, buttonIndex });
    }
  }

  shellySetOffWithButton({ buttonIndex }, meta) {
    if (typeof this._onSetOff === 'function') {
      this._onSetOff({ groupId: meta && meta.groupId, buttonIndex });
    }
  }

  shellyToggleWithButton({ buttonIndex }, meta) {
    if (typeof this._onToggle === 'function') {
      this._onToggle({ groupId: meta && meta.groupId, buttonIndex });
    }
  }

}

module.exports = OnOffBoundCluster;
