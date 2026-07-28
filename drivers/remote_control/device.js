'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

const ShellyBasicCluster = require('../../lib/ShellyBasicCluster');
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');

// Register the custom Basic cluster with Shelly manufacturer-specific attributes
Cluster.addCluster(ShellyBasicCluster);

/**
 * Shelly BLU Remote Control ZB
 *
 * This remote does NOT use Zigbee binding. Instead, it groupcasts On/Off and
 * Level Control commands to configurable groups. The group addresses are stored
 * as 4 manufacturer-specific attributes (0x8000–0x8003, mfgCode 0x1002) in the
 * Basic cluster on endpoint 1.
 *
 * Commands sent by the remote:
 *   On/Off cluster (client):       Off, On, Toggle
 *   Level Control cluster (client): MoveToLevel
 */
class RemoteControl extends ZigBeeDevice {

  async onNodeInit({ zclNode }) {
    // Register measure_battery capability and configure attribute reporting
    this.batteryThreshold = 20;
    this.registerCapability('alarm_battery', CLUSTER.POWER_CONFIGURATION, {
      getOpts: {
        getOnStart: true,
      },
      reportOpts: {
        configureAttributeReporting: {
          minInterval: 0,
          maxInterval: 60000, // ~16 hours
          minChange: 5,
        },
      },
    });

    // Bind On/Off groupcast commands
    zclNode.endpoints[1].bind(CLUSTER.ON_OFF.NAME, new OnOffBoundCluster({
      onSetOn: this._onCommandHandler.bind(this),
      onSetOff: this._offCommandHandler.bind(this),
      onToggle: this._toggleCommandHandler.bind(this),
    }));

    // Bind Level Control groupcast commands
    zclNode.endpoints[1].bind(CLUSTER.LEVEL_CONTROL.NAME, new LevelControlBoundCluster({
      onMoveToLevel: this._moveToLevelCommandHandler.bind(this),
      onMoveToLevelWithOnOff: this._moveToLevelCommandHandler.bind(this),
    }));

    // Read group addresses from the device (non-blocking, device is sleepy)
    this._readGroupAddresses(zclNode).catch(err => {
      this.error('Could not read group addresses on init (device may be asleep):', err.message);
    });
  }

  /**
   * Read the 4 manufacturer-specific group address attributes from the Basic cluster.
   * Since this is a sleepy device, this may time out — it is best done right after
   * pairing when the device is still awake.
   * @param {object} zclNode
   * @private
   */
  async _readGroupAddresses(zclNode) {
    try {
      const basicCluster = zclNode.endpoints[1].clusters.basic;
      const result = await basicCluster.readAttributes([
        'shellyGroupAddress1',
        'shellyGroupAddress2',
        'shellyGroupAddress3',
        'shellyGroupAddress4',
      ]);

      this.log('Group addresses read from device:', result);

      const settings = {};
      if (result.shellyGroupAddress1 != null) settings.group_address_1 = result.shellyGroupAddress1;
      if (result.shellyGroupAddress2 != null) settings.group_address_2 = result.shellyGroupAddress2;
      if (result.shellyGroupAddress3 != null) settings.group_address_3 = result.shellyGroupAddress3;
      if (result.shellyGroupAddress4 != null) settings.group_address_4 = result.shellyGroupAddress4;

      if (Object.keys(settings).length > 0) {
        await this.setSettings(settings);
        this.log('Group address settings saved:', settings);
      }
    } catch (err) {
      this.error('Failed to read group addresses:', err.message);
      throw err;
    }
  }

  /**
   * Write group addresses to the device when settings are changed.
   * @param {object} oldSettings
   * @param {object} newSettings
   * @param {string[]} changedKeys
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
    const attrMap = {
      group_address_1: 'shellyGroupAddress1',
      group_address_2: 'shellyGroupAddress2',
      group_address_3: 'shellyGroupAddress3',
      group_address_4: 'shellyGroupAddress4',
    };

    const writeAttrs = {};
    for (const key of changedKeys) {
      if (attrMap[key]) {
        writeAttrs[attrMap[key]] = newSettings[key];
      }
    }

    if (Object.keys(writeAttrs).length > 0) {
      this.log('Writing group addresses to device:', writeAttrs);
      const basicCluster = this.zclNode.endpoints[1].clusters.basic;
      await basicCluster.writeAttributes(writeAttrs);
      this.log('Group addresses written successfully');
    }
  }

  // ---------------------------------------------------------------------------
  //  On/Off command handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles the On command from the remote.
   * @private
   */
  _onCommandHandler() {
    this.log('Received On command');
    this.triggerFlow({ id: 'remote_on' })
      .then(() => this.log('Flow triggered: remote_on'))
      .catch(err => this.error('Error triggering flow remote_on:', err));
  }

  /**
   * Handles the Off command from the remote.
   * @private
   */
  _offCommandHandler() {
    this.log('Received Off command');
    this.triggerFlow({ id: 'remote_off' })
      .then(() => this.log('Flow triggered: remote_off'))
      .catch(err => this.error('Error triggering flow remote_off:', err));
  }

  /**
   * Handles the Toggle command from the remote.
   * @private
   */
  _toggleCommandHandler() {
    this.log('Received Toggle command');
    this.triggerFlow({ id: 'remote_toggle' })
      .then(() => this.log('Flow triggered: remote_toggle'))
      .catch(err => this.error('Error triggering flow remote_toggle:', err));
  }

  // ---------------------------------------------------------------------------
  //  Level Control command handlers
  // ---------------------------------------------------------------------------

  /**
   * Handles the MoveToLevel command from the remote.
   * @param {object} payload
   * @param {number} payload.level - Target level (0–254)
   * @param {number} payload.transitionTime - Transition time in 1/10th seconds
   * @private
   */
  _moveToLevelCommandHandler({ level, transitionTime }) {
    // Normalize level from 0–254 to 0–1
    const normalizedLevel = Math.min(Math.max(level / 254, 0), 1);
    const roundedLevel = Math.round(normalizedLevel * 100) / 100;

    this.log(`Received MoveToLevel command: level=${level} (${roundedLevel}), transitionTime=${transitionTime}`);

    this.triggerFlow({
      id: 'remote_level',
      tokens: {
        level: roundedLevel,
        level_raw: level,
        transition_time: transitionTime != null ? transitionTime / 10 : 0,
      },
    })
      .then(() => this.log('Flow triggered: remote_level'))
      .catch(err => this.error('Error triggering flow remote_level:', err));
  }

}

module.exports = RemoteControl;
