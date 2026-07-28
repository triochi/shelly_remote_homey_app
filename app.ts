'use strict';

import Homey from 'homey';

module.exports = class ShellyBluRemoteApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('Shelly BLU Remote ZB app has been initialized');
  }

}
