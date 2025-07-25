import React, { useContext, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import Papa from 'papaparse';
import Share from 'react-native-share';
import { encode } from 'base-64';
import Toast from 'react-native-toast-message';
import BottomNavBar from '../components/BottomNavBar';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import RNFS from 'react-native-fs';
import { zip } from 'react-native-zip-archive';

const ExportDataScreen = () => {
  const { data = {}, connectedDevice } = useContext(BatteryBluetoothContext);
  const [recordedData, setRecordedData] = useState<any[]>([]);
  const [rawFrames, setRawFrames] = useState<any[]>([]);
  const rotation = useRef(new Animated.Value(0)).current;

  // Extract message blocks
  const {
    messageDIU1 = {}, messageDIU2 = {}, messageDIU3 = {}, messageDIU4 = {},
    messageDIU14 = {}, messageDriveParameters = {}, messageMCU1 = {},
    messageMCU2 = {}, messageMCU3 = {}
  } = data;

  useEffect(() => {
    const intervalId: ReturnType<typeof setInterval> = setInterval(() => {
        if (!data?.rawFrame || !data?.messageMCU1) return; // ⬅️ Skip if no data
      const newData = {
        timestamp: new Date().toISOString(),
        soc: messageDIU4.stateOfCharge?.toFixed(1) || 0,
        batteryCurrent: messageDIU2.batteryCurrent?.toFixed(1) || 0,
        minCellVoltage: messageDIU3.minCellVoltage?.toFixed(3) || 0,
        maxCellVoltage: messageDIU3.maxCellVoltage?.toFixed(3) || 0,
        maxCellTemp: messageDriveParameters.maxCellTemp || 0,
        minCellTemp: messageDriveParameters.minCellTemp || 0,
        availableEnergy: messageDriveParameters.availableEnergy?.toFixed(2) || 0,
        driveCurrentLimit: messageDIU2.driveCurrentLimit || 0,
        regenCurrentLimit: messageDIU2.regenCurrentLimit || 0,
        controllerTemperature: messageMCU1.controllerTemperature || 0,
        motorTemperature: messageMCU1.motorTemperature || 0,
        rmsCurrent: messageMCU1.rmsCurrent?.toFixed(1) || 0,
        throttle: messageMCU1.throttle || 0,
        brake: messageMCU1.brake || 0,
        speed: messageMCU1.speed || 0,
        motorRPM: messageMCU2.motorRPM || 0,
        capacitorVoltage: messageMCU2.capacitorVoltage?.toFixed(1) || 0,
        odometer: messageMCU2.odometer?.toFixed(1) || 0,
        controllerFaults: messageMCU3.faultMessages?.join(', ') || 'None',
      };
      setRecordedData(prev => [...prev, newData]);
      if (data?.rawFrame) {
  setRawFrames(prev => [...prev, data.rawFrame]);
}
    }, 10);

    return () => clearInterval(intervalId);
  }, [data]);
  
  const generateTRCFileContent = (frames: any[]) => {
  const header = [
    '; Generated by React Native CAN Logger',
    '; Message Number | Time Offset (s) | Type | CAN ID (hex) | DLC | Data Bytes (hex)',
    ''
  ].join('\n');

  const body = frames.map((frame, index) => {
  const { timeOffsetMs = 0, id = '00000000', bytes = [], type = 'Rx' } = frame;

  const msgNum = `${index + 1})`.padEnd(5);
  const timestamp = Number(timeOffsetMs).toFixed(3).padStart(8);
  const frameType = type.padStart(3);
  const canId = id.padStart(8, '0');
  const dlc = `${bytes.length}`.padStart(2);
  const data = bytes.join(' ').padEnd(23);

  return `${msgNum}${timestamp} ${frameType}  ${canId} ${dlc} ${data}`;
});

  return `${header}\n${body.join('\n')}`;
};
  const handleExport = async () => {
  if (!recordedData.length || !rawFrames.length) {
    Toast.show({ type: 'info', text1: 'No data to export' });
    return;
  }

  animateRotation();

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const folderPath = `${RNFS.CachesDirectoryPath}/export_${timestamp}`;
  const csvPath = `${folderPath}/data.csv`;
  const trcPath = `${folderPath}/data.trc`;
  const zipPath = `${RNFS.CachesDirectoryPath}/export_${timestamp}.zip`;

  try {
    // 1. Create folder
    await RNFS.mkdir(folderPath);

    // 2. Write files to folder
    const csv = Papa.unparse(recordedData);
    console.log('TRC Frame Sample:', rawFrames.find(f => f.timeOffsetMs === undefined));
    const trc = generateTRCFileContent(rawFrames);
    await RNFS.writeFile(csvPath, csv, 'utf8');
    await RNFS.writeFile(trcPath, trc, 'utf8');

    // 3. Zip the folder
    const zippedPath = await zip(folderPath, zipPath);

    // 4. Share the zip
    await Share.open({
      title: 'Share Exported Logs',
      url: `file://${zippedPath}`,
      type: 'application/zip',
    });

    Toast.show({ type: 'success', text1: 'Exported as ZIP' });
  } catch (err) {
    console.error('❌ Export ZIP failed:', err);
    Toast.show({ type: 'error', text1: 'ZIP Export Failed' });
  }
};

  const animateRotation = () => {
    rotation.setValue(0);
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      { iterations: 1 }
    ).start();
  };

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <LinearGradient colors={['#0a0f1c', '#1f2937', '#111827']} style={styles.container}>
      <Text style={styles.header}>Export Battery & Motor Data</Text>
      <Text style={styles.subText}>Recorded Points: {recordedData.length}</Text>

      <TouchableOpacity style={styles.iconWrapper} onPress={handleExport}>
        <Animated.View style={[styles.iconCircle, { transform: [{ rotate: spin }] }]}>
          <Icon name="export-variant" size={60} color="#facc15" />
        </Animated.View>
        <Text style={styles.iconLabel}>Export</Text>
      </TouchableOpacity>

      <BottomNavBar />
      <Toast />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 32,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#facc15',
    textAlign: 'center',
  },
  subText: {
    color: '#cbd5e1',
    marginTop: 4,
    fontSize: 14,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 25,
    gap: 10,
  },
  iconCircle: {
    backgroundColor: '#1e293b',
    padding: 20,
    borderRadius: 60,
    // elevation: 4,
  },
  iconLabel: {
    color: '#f9fafb',
    fontSize: 16,
    marginTop: 6,
  },
});

export default ExportDataScreen;