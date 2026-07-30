'use strict';

import Homey from 'homey';
const { debug } = require('zigbee-clusters');

module.exports = class ShellyBluRemoteApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Shelly BLU Remote ZB app has been initialized');

    // Enable zigbee-clusters debug logging to see ZCL frames
    debug(true);
  }

}
