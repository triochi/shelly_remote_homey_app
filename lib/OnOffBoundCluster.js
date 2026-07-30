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

  setOn(args, meta) {
    if (typeof this._onSetOn === 'function') {
      this._onSetOn({ groupId: meta && meta.groupId });
    }
  }

  setOff(args, meta) {
    if (typeof this._onSetOff === 'function') {
      this._onSetOff({ groupId: meta && meta.groupId });
    }
  }

  toggle(args, meta) {
    if (typeof this._onToggle === 'function') {
      this._onToggle({ groupId: meta && meta.groupId });
    }
  }

}

module.exports = OnOffBoundCluster;
