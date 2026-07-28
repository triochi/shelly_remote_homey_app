'use strict';

const { BoundCluster } = require('zigbee-clusters');

/**
 * BoundCluster implementation for receiving groupcast Level Control commands
 * from the Shelly BLU Remote Control ZB.
 *
 * Per the ZAP configuration the remote only enables the MoveToLevel (0x00)
 * command on its Level Control client cluster.
 */
class LevelControlBoundCluster extends BoundCluster {

  constructor({ onMoveToLevel, onMoveToLevelWithOnOff }) {
    super();
    this._onMoveToLevel = onMoveToLevel;
    this._onMoveToLevelWithOnOff = onMoveToLevelWithOnOff;
  }

  moveToLevel(payload) {
    if (typeof this._onMoveToLevel === 'function') {
      this._onMoveToLevel(payload);
    }
  }

  moveToLevelWithOnOff(payload) {
    if (typeof this._onMoveToLevelWithOnOff === 'function') {
      this._onMoveToLevelWithOnOff(payload);
    }
  }

}

module.exports = LevelControlBoundCluster;
