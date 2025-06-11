import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  BackHandler,
  Modal,
} from 'react-native';
import { BluetoothContext } from '../services/BluetoothServices';
import { BatteryBluetoothContext } from '../services/BatteryBluetoothProvider';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigationTypes';
import { BleManager, Device } from 'react-native-ble-plx';
import requestBluetoothPermissions from '../services/requestBluetoothPermissions';
import { getAuth } from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import SideMenu from './SideMenu';
import LinearGradient from 'react-native-linear-gradient';
import Toast from 'react-native-toast-message';

const manager = new BleManager();
const authInstance = getAuth(getApp());

const HomeScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList, 'Home'>>();
  const { connectedDevice: bldcDevice, connectToDevice: connectToBldc, disconnectDevice: disconnectBldc } = useContext(BluetoothContext);
  const { connectedDevice: batteryDevice, connectToDevice: connectToBattery, disconnectDevice: disconnectBattery } = useContext(BatteryBluetoothContext);
  const [devices, setDevices] = useState<Device[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [trialDaysLeft, setTrialDaysLeft] = useState<number | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [isSubscribed, setIsSubscribed] = useState<boolean | null>(null);
  const [showTrialModal, setShowTrialModal] = useState<boolean>(false);

  useEffect(() => {
    requestBluetoothPermissions();

    const fetchTrialData = async () => {
      const user = authInstance.currentUser;
      if (user) {
        const creationTimeStr = user.metadata.creationTime;
        if (creationTimeStr) {
          const trialStart = new Date(creationTimeStr);
          const now = new Date();
          const diffMs = now.getTime() - trialStart.getTime();
          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          const trialPeriod = 15;
          const daysLeft = trialPeriod - diffDays;

          if (daysLeft > 0) {
            setTrialDaysLeft(daysLeft);
            setIsSubscribed(true);
            Toast.show({
              type: 'success',
              text1: 'Free Trial Active',
              text2: `Your trial expires in ${daysLeft} days.`,
              visibilityTime: 4000,
              autoHide: true,
              position: 'bottom',
            });
          } else {
            setTrialDaysLeft(0);
            const db = getFirestore(getApp());
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);
            const subscribed = userDoc.exists && userDoc.data()?.isSubscribed;
            setIsSubscribed(subscribed);
            if (!subscribed) {
              setShowTrialModal(true);
            }
          }
        } else {
          console.error('User creation time is undefined');
          setTrialDaysLeft(0);
          setIsSubscribed(false);
          setShowTrialModal(true);
        }
      }
    };

    fetchTrialData();

    return () => {
      manager.stopDeviceScan();
    };
  }, []);

  useEffect(() => {
    console.log('BLDC Device:', bldcDevice ? bldcDevice.id : 'None');
    console.log('Battery Device:', batteryDevice ? batteryDevice.id : 'None');
  }, [bldcDevice, batteryDevice]);

  const startScan = async () => {
    if (isScanning) return;

    await requestBluetoothPermissions();
    setDevices([]);
    setIsScanning(true);

    manager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error('Scan Error:', error);
        Toast.show({
          type: 'error',
          text1: 'Failed to scan for devices. Turn on your device Bluetooth',
          visibilityTime: 4000,
          autoHide: true,
          position: 'top',
        });
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        setDevices((prevDevices) => {
          const exists = prevDevices.some((d) => d.id === device.id);
          if (!exists) return [...prevDevices, device];
          return prevDevices;
        });
      }
    });

    setTimeout(() => {
      manager.stopDeviceScan();
      setIsScanning(false);
    }, 10000);
  };

  const handleConnect = async (device: Device) => {
    try {
      await connectToBldc(device);
      await connectToBattery(device);
      console.log('Connected to device:', device.name || device.id);
    } catch (error) {
      console.error('Connection error:', error);
      Toast.show({
        type: 'error',
        text1: 'Failed to connect to device',
        visibilityTime: 4000,
      });
    } finally {
      manager.stopDeviceScan();
      setIsScanning(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (bldcDevice) {
        await disconnectBldc();
        console.log('Disconnected from BLDC device');
      }
      if (batteryDevice) {
        await disconnectBattery();
        console.log('Disconnected from Battery device');
      }
      Toast.show({
        type: 'success',
        text1: 'Disconnected',
        text2: 'Successfully disconnected from the device',
        visibilityTime: 4000,
      });
    } catch (error) {
      console.error('Disconnection error:', error);
      Toast.show({
        type: 'error',
        text1: 'Disconnection Failed',
        text2: 'Could not disconnect from the device',
        visibilityTime: 4000,
      });
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleSubscribe = () => {
    setShowTrialModal(false);
    navigation.navigate('PaymentScreen');
  };

  const handleCancel = () => {
    setShowTrialModal(false);
    BackHandler.exitApp();
  };

  return (
    <LinearGradient
      colors={['#FFF8E7', '#FFEFD5']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={toggleMenu}
          activeOpacity={0.7}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {bldcDevice || batteryDevice ? 'Connected to Device' : 'App is Disconnected'}
        </Text>
      </View>

      <View style={styles.logoContainer}>
        <Image source={require('../assets/intuteLogo.png')} style={styles.logo} />
      </View>

      <View style={styles.buttonContainer}>
        {!bldcDevice && !batteryDevice && (
          <TouchableOpacity
            style={[styles.button, styles.scanButton]}
            onPress={startScan}
            disabled={isScanning || !isSubscribed}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#F59E0B', '#FBBF24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Scan for Bluetooth Devices</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {isScanning && (
          <ActivityIndicator size="large" color="#F59E0B" style={styles.activityIndicator} />
        )}

        {!bldcDevice && !batteryDevice && (
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.deviceItem}
                onPress={() => handleConnect(item)}
                activeOpacity={0.8}
                disabled={!isSubscribed}
              >
                <View style={styles.deviceDetails}>
                  <Text style={styles.deviceName}>{item.name || 'Unknown Device'}</Text>
                  <Text style={styles.deviceId}>{item.id}</Text>
                </View>
              </TouchableOpacity>
            )}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              !isScanning ? (
                <Text style={styles.noDevices}>No devices found</Text>
              ) : null
            }
          />
        )}

        {(bldcDevice || batteryDevice) && (
          <TouchableOpacity
            style={[styles.button, styles.goToDashboardButton]}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.7}
            disabled={!isSubscribed}
          >
            <LinearGradient
              colors={['#F59E0B', '#FBBF24']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Go to Dashboard</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {(bldcDevice || batteryDevice) && (
          <TouchableOpacity
            style={[styles.button, styles.disconnectButton]}
            onPress={handleDisconnect}
            activeOpacity={0.7}
            disabled={!isSubscribed}
          >
            <LinearGradient
              colors={['#EF4444', '#F87171']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Disconnect</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        <View style={styles.trialContent}>
          {trialDaysLeft !== null && trialDaysLeft > 0 && (
            <View style={styles.trialMessage}>
              {/* <Text style={styles.trialIcon}>⏳</Text>  */}
              <Text style={styles.trialText}>
                Your free trial expires in {trialDaysLeft} days
              </Text>
            </View>
          )}
        </View>
      </View>

      <Modal
        visible={showTrialModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {}}
      >
        <View style={styles.modalOverlay}>
          <LinearGradient
            colors={['#FFF8E7', '#FFEFD5']}
            style={styles.modalContainer}
          >
            <Text style={styles.modalTitle}>Trial Expired</Text>
            <Text style={styles.modalMessage}>
              Your 15-day free trial has ended. Subscribe now to continue enjoying the app!
            </Text>
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#EF4444', '#F87171']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </LinearGradient>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.subscribeButton]}
                onPress={handleSubscribe}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={['#F59E0B', '#FBBF24']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.buttonGradient}
                >
                  <Text style={styles.modalButtonText}>Subscribe</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>

      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} isSubscribed={isSubscribed} />
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '90%',
    marginBottom: 20,
  },
  menuButton: {
    padding: 5,
    marginLeft: -5,
    marginBottom: 10,
  },
  menuIcon: {
    fontSize: 28,
    color: '#1F2937',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    flex: 1,
    letterSpacing: 0.5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  logo: {
    width: 220,
    height: 120,
    resizeMode: 'contain',
    marginLeft: 60,
  },
  buttonContainer: {
    flex: 1,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  button: {
    width: '85%',
    marginVertical: 12,
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderRadius: 16,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scanButton: {},
  goToDashboardButton: {},
  disconnectButton: {},
  activityIndicator: {
    marginVertical: 20,
  },
  list: {
    paddingBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  deviceItem: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    width: '92%',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  deviceDetails: {
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  deviceId: {
    fontSize: 14,
    color: '#6B7280',
  },
  noDevices: {
    color: '#6B7280',
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
    fontWeight: '500',
  },
  trialContent: {
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
    marginBottom: 30,
  },
  trialMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  trialIcon: {
    fontSize: 20,
    marginRight: 8,
    color: '#F59E0B',
  },
  trialText: {
    fontSize: 16,
    color: '#1F2937',
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainer: {
    width: '85%',
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '400',
    lineHeight: 22,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 12,
  },
  modalButton: {
  flex: 1,
  borderRadius: 10, // slightly smaller
  overflow: 'hidden',
  paddingVertical: 0, // remove padding here
},
  modalButtonText: {
  color: '#FFFFFF',
  fontSize: 16, // reduced from 16
  fontWeight: '600',
  textAlign: 'center',
  paddingVertical: 6, // reduced from 14
},
  cancelButton: {},
  subscribeButton: {},
});

export default HomeScreen;