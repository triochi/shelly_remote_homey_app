'use strict';

const { ZigBeeDevice } = require('homey-zigbeedriver');
const { Cluster, CLUSTER } = require('zigbee-clusters');

const ShellyBasicCluster = require('../../lib/ShellyBasicCluster');
const ShellyOnOffCluster = require('../../lib/ShellyOnOffCluster');
const ShellyLevelControlCluster = require('../../lib/ShellyLevelControlCluster');
const OnOffBoundCluster = require('../../lib/OnOffBoundCluster');
const LevelControlBoundCluster = require('../../lib/LevelControlBoundCluster');

// Register custom clusters with Shelly manufacturer-specific extensions
Cluster.addCluster(ShellyBasicCluster);
Cluster.addCluster(ShellyOnOffCluster);
Cluster.addCluster(ShellyLevelControlCluster);

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
    // Register flow card run listeners for button filtering.
    // args.button is what the user configures on the card (0 = any button).
    // state.button is the actual button index from the received command.
    const buttonRunListener = async (args, state) => {
      if (args.button === 0) return true; // 0 means "any button"
      return args.button === state.button;
    };

    this.homey.flow.getDeviceTriggerCard('remote_on').registerRunListener(buttonRunListener);
    this.homey.flow.getDeviceTriggerCard('remote_off').registerRunListener(buttonRunListener);
    this.homey.flow.getDeviceTriggerCard('remote_toggle').registerRunListener(buttonRunListener);
    this.homey.flow.getDeviceTriggerCard('remote_level').registerRunListener(buttonRunListener);

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

    // Read device settings from the device (non-blocking, device is sleepy)
    this._readDeviceSettings(zclNode).catch(err => {
      this.error('Could not read device settings on init (device may be asleep):', err.message);
    });
  }

  /**
   * Read the manufacturer-specific attributes from the Basic cluster:
   * group addresses (0x8000–0x8003) and command mode (0x8004).
   * Since this is a sleepy device, this may time out — it is best done right
   * after pairing when the device is still awake.
   * @param {object} zclNode
   * @private
   */
  async _readDeviceSettings(zclNode) {
    const basicCluster = zclNode.endpoints[1].clusters.basic;

    try {
      const result = await basicCluster.readAttributes([
        'shellyGroupAddress1',
        'shellyGroupAddress2',
        'shellyGroupAddress3',
        'shellyGroupAddress4',
        'shellyCommandMode',
      ]);
      this.log('Device settings read:', result);

      const settings = {};
      if (result.shellyGroupAddress1 != null) settings.group_address_1 = result.shellyGroupAddress1;
      if (result.shellyGroupAddress2 != null) settings.group_address_2 = result.shellyGroupAddress2;
      if (result.shellyGroupAddress3 != null) settings.group_address_3 = result.shellyGroupAddress3;
      if (result.shellyGroupAddress4 != null) settings.group_address_4 = result.shellyGroupAddress4;
      if (result.shellyCommandMode != null) settings.command_mode = String(result.shellyCommandMode);

      if (Object.keys(settings).length > 0) {
        await this.setSettings(settings);
        this.log('Device settings saved:', settings);
      }
    } catch (err) {
      this.error('Failed to read device settings:', err.message);
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
      command_mode: 'shellyCommandMode',
    };

    const writeAttrs = {};
    for (const key of changedKeys) {
      if (attrMap[key]) {
        // command_mode is stored as string in dropdown, convert to uint8
        writeAttrs[attrMap[key]] = key === 'command_mode'
          ? parseInt(newSettings[key], 10)
          : newSettings[key];
      }
    }

    if (Object.keys(writeAttrs).length > 0) {
      this.log('Writing settings to device:', writeAttrs);
      const basicCluster = this.zclNode.endpoints[1].clusters.basic;
      await basicCluster.writeAttributes(writeAttrs);
      this.log('Settings written successfully');
    }
  }

  // ---------------------------------------------------------------------------
  //  On/Off command handlers
  // ---------------------------------------------------------------------------

  /**
   * Resolves the button index from the command parameters.
   * In custom mode: buttonIndex comes directly from the mfg-specific command.
   * In standard mode: buttonIndex is null (unknown).
   * @param {number|null} buttonIndex
   * @returns {number} button index (1–4), or -1 if unknown
   * @private
   */
  _resolveButton(buttonIndex) {
    return buttonIndex != null ? buttonIndex : -1;
  }

  /**
   * Handles the On command from the remote.
   * @param {object} params
   * @param {number} [params.groupId] - Zigbee group ID the command was sent to
   * @param {number|null} [params.buttonIndex] - Button index (custom mode only)
   * @private
   */
  _onCommandHandler({ groupId, buttonIndex }) {
    const button = this._resolveButton(buttonIndex);
    this.log(`Received On command (group=${groupId}, button=${button})`);
    this.triggerFlow({
      id: 'remote_on',
      tokens: { button },
      state: { button },
    })
      .then(() => this.log('Flow triggered: remote_on'))
      .catch(err => this.error('Error triggering flow remote_on:', err));
  }

  /**
   * Handles the Off command from the remote.
   * @param {object} params
   * @param {number} [params.groupId] - Zigbee group ID the command was sent to
   * @param {number|null} [params.buttonIndex] - Button index (custom mode only)
   * @private
   */
  _offCommandHandler({ groupId, buttonIndex }) {
    const button = this._resolveButton(buttonIndex);
    this.log(`Received Off command (group=${groupId}, button=${button})`);
    this.triggerFlow({
      id: 'remote_off',
      tokens: { button },
      state: { button },
    })
      .then(() => this.log('Flow triggered: remote_off'))
      .catch(err => this.error('Error triggering flow remote_off:', err));
  }

  /**
   * Handles the Toggle command from the remote.
   * @param {object} params
   * @param {number} [params.groupId] - Zigbee group ID the command was sent to
   * @param {number|null} [params.buttonIndex] - Button index (custom mode only)
   * @private
   */
  _toggleCommandHandler({ groupId, buttonIndex }) {
    const button = this._resolveButton(buttonIndex);
    this.log(`Received Toggle command (group=${groupId}, button=${button})`);
    this.triggerFlow({
      id: 'remote_toggle',
      tokens: { button },
      state: { button },
    })
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
  _moveToLevelCommandHandler({ level, transitionTime, groupId, buttonIndex }) {
    // Normalize level from 0–254 to 0–1
    const normalizedLevel = Math.min(Math.max(level / 254, 0), 1);
    const roundedLevel = Math.round(normalizedLevel * 100) / 100;
    const button = this._resolveButton(buttonIndex);

    this.log(`Received MoveToLevel command: level=${level} (${roundedLevel}), transitionTime=${transitionTime}, button=${button}`);

    this.triggerFlow({
      id: 'remote_level',
      tokens: {
        level: roundedLevel,
        level_raw: level,
        transition_time: transitionTime != null ? transitionTime / 10 : 0,
        button,
      },
      state: { button },
    })
      .then(() => this.log('Flow triggered: remote_level'))
      .catch(err => this.error('Error triggering flow remote_level:', err));
  }

}

module.exports = RemoteControl;
