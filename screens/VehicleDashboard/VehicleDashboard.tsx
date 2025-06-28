import React, { useContext, useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import VehicleDashboardUI from './VehicleDashboardUI';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import { BluetoothContext } from '../../services/BluetoothServices';
import Orientation from 'react-native-orientation-locker';

const VehicleDashboard = () => {
  const { data: batteryData, connectedDevice: batteryConnected } = useContext(BatteryBluetoothContext);
  const { connectedDevice: bldcConnected } = useContext(BluetoothContext);
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [isBluetoothPopupVisible, setBluetoothPopupVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    Orientation.lockToLandscape();
    return () => Orientation.unlockAllOrientations();
  }, []);

  const mcu1 = batteryData.messageMCU1 || {};
  const diu4 = batteryData.messageDIU4 || {};
  const diu2 = batteryData.messageDIU2 || {};
  const driveParams = batteryData.messageDriveParameters || {};
  const gpio = batteryData.gpioStates?.states || {};

  let gear: 'f' | 'n' | 'r' = 'n';
  if (gpio.FWD_OUT) gear = 'f';
  else if (gpio.REV_OUT) gear = 'r';
  else if (gpio.NEUTRAL_OUT) gear = 'n';

  return (
    <SafeAreaView style={styles.fullScreen}>
      <VehicleDashboardUI
        speed={mcu1.speed}
        time={time}
        batteryPercentage={diu4.stateOfCharge}
        gear={gear}
        mode={gpio.ECO_OUT ? 'eco' : gpio.SPORTS_OUT ? 'sports' : undefined}
        range={diu4.distanceToEmpty}
        odometer={batteryData.messageMCU2?.odometer}
        turnSignal={
          gpio.LEFT_OUT ? 'left' :
          gpio.RIGHT_OUT ? 'right' :
          null
        }
        brakeStatus={{
          bf: !!gpio.BRAKE_OUT,
          hb: false,
          s: false,
        }}
        headlightStatus={{
          low: gpio.LOWB_OUT,
          high: gpio.HIGHB_OUT,
          hazard: false,
          service: false,
        }}
        isConnected={!!(batteryConnected || bldcConnected)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: '#fff',
  },
});

export default VehicleDashboard;