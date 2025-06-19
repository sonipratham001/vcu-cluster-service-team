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
  const [isBluetoothPopupVisible, setBluetoothPopupVisible] = useState(false); // 👈 Bluetooth popup state

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

  let gear: 'f' | 'n' | 'r' = 'n';
  if (mcu1.driveMode === 2) gear = 'f';
  else if (mcu1.driveMode === 3) gear = 'r';

  return (
    <SafeAreaView style={styles.fullScreen}>
      <VehicleDashboardUI
        speed={mcu1.speed}
        time={time}
        batteryPercentage={diu4.stateOfCharge}
        gear={gear}
        mode={mcu1.driveMode === 1 ? 'eco' : 'sports'}
        range={diu4.distanceToEmpty}
        odometer={batteryData.messageMCU2?.odometer}
        turnSignal={null}
        brakeStatus={{
          bf: !!mcu1.brake,
          hb: false,
          s: false,
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