/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React, { Component } from 'react';
import { Platform, StyleSheet, Text, View, Button } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

const instructions = Platform.select({
  ios: 'Press Cmd+R to reload,\n' + 'Cmd+D or shake for dev menu',
  android:
    'Double tap R on your keyboard to reload,\n' +
    'Shake or press menu button for dev menu',
});

type Props = {};

export default class App extends Component<Props> {
  constructor() {
    super();
    this.manager = new BleManager();
    this.state = { info: "xxxxxxx", values: {}, devices: {} }
  }

  info(message) {
    this.setState({ info: message })
  }

  error(message) {
    this.setState({ info: "ERROR: " + message })
  }

  updateValue(key, value) {
    this.setState({ values: { ...this.state.values, [key]: value } })
  }

  componentWillMount() {
    if (Platform.OS === 'ios') {
      const subscription = this.manager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          this.scanAndConnect();
          subscription.remove();
        }
      }, true);
    } else {
      this.scanAndConnect()
    }
  }

  async setupNotifications(device) {
    for (const id in this.sensors) {
      const service = this.serviceUUID(id)
      const characteristicW = this.writeUUID(id)
      const characteristicN = this.notifyUUID(id)

      const characteristic = await device.writeCharacteristicWithResponseForService(
        service, characteristicW, "AQ==" /* 0x01 in hex */
      )

      device.monitorCharacteristicForService(service, characteristicN, (error, characteristic) => {
        if (error) {
          this.error(error.message)
          return
        }
        this.updateValue(characteristic.uuid, characteristic.value)
      })
    }
  }

  scanAndConnect() {
    this.manager.startDeviceScan(null,
      null, (error, device) => {
        this.info("Scanning...")
        console.log(device)

        if (error) {
          this.error(error.message)
          return
        }

        this.setState({ devices: { ...this.state.devices, [device.id]: device.name } })

        // this.manager.stopDeviceScan()

        // if (device.name === "Kit's MacBook Pro") {
        //   this.info("Connecting to Kit's MacBook Pro")
        //   this.manager.stopDeviceScan()
        //   device.connect()
        //     //     .then((device) => {
        //     //       this.info("Discovering services and characteristics")
        //     //       return device.discoverAllServicesAndCharacteristics()
        //     //     })
        //     //     .then((device) => {
        //     //       this.info("Setting notifications")
        //     //       return this.setupNotifications(device)
        //     //     })
        //     .then(() => {
        //       this.info("Listening...")
        //     }, (error) => {
        //       this.error(error.message)
        //     })
        // }
      });
  }
  handlePress = (key) => {
    this.info(key)
  }

  render() {
    return (
      <View style={styles.container}>
        <Text>{this.state.info}</Text>
        {Object.keys(this.state.devices).map((key) => {
          return <Button 
            key={key} 
            title={this.state.devices[key] || "Unnamed"}
            onPress={()=>{this.handlePress(key)}}
          />
        })}
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  },
  welcome: {
    fontSize: 20,
    textAlign: 'center',
    margin: 10,
  },
  instructions: {
    textAlign: 'center',
    color: '#333333',
    marginBottom: 5,
  },
});
