'use strict';

const { BoundCluster } = require('zigbee-clusters');

/**
 * BoundCluster implementation for receiving groupcast On/Off commands
 * from the Shelly BLU Remote Control ZB.
 *
 * The remote sends Off (0x00), On (0x01) and Toggle (0x02) commands
 * as groupcast messages to its configured groups.
 */
class OnOffBoundCluster extends BoundCluster {

  constructor({ onSetOn, onSetOff, onToggle }) {
    super();
    this._onSetOn = onSetOn;
    this._onSetOff = onSetOff;
    this._onToggle = onToggle;
  }

  setOn() {
    if (typeof this._onSetOn === 'function') {
      this._onSetOn();
    }
  }

  setOff() {
    if (typeof this._onSetOff === 'function') {
      this._onSetOff();
    }
  }

  toggle() {
    if (typeof this._onToggle === 'function') {
      this._onToggle();
    }
  }

}

module.exports = OnOffBoundCluster;
