import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  Image,
  Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GearSelector from '../components/GearSelector';
import BatteryIndicator from '../components/BatteryIndicator';
import CurvedPartitionLines from '../components/CurvedPartitionLines';
import BottomNavBar from '../components/BottomNavBar';
import LinearGradient from 'react-native-linear-gradient';

const { width, height } = Dimensions.get('window');

interface VehicleDashboardUIProps {
  speed?: number;
  time?: string;
  batteryPercentage?: number;
  gear?: 'f' | 'n' | 'r';
  mode?: 'eco' | 'sports';
  range?: number;
  odometer?: number;
  turnSignal?: 'left' | 'right' | null;
  brakeStatus?: {
    bf?: boolean;
    hb?: boolean;
    s?: boolean;
  };
  isConnected: boolean;
  headlightStatus?: {
    low?: boolean;
    high?: boolean;
    hazard?: boolean;
    service?: boolean;
  };
}

const VehicleDashboardUI: React.FC<VehicleDashboardUIProps> = ({
  speed,
  time,
  batteryPercentage,
  gear,
  mode,
  range,
  odometer,
  turnSignal,
  brakeStatus,
  isConnected,
  headlightStatus,
}) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (turnSignal) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      blinkAnim.setValue(1);
    }
  }, [turnSignal]);

  return (
    <LinearGradient colors={['#0a0f1c', '#1f2937', '#111827']} style={{ flex: 1 }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.scrollContainer}>
          <CurvedPartitionLines />
          <View style={styles.container}>
            {/* Turn Signals Row */}
            <View style={styles.topRow}>
              <Animated.View style={{ opacity: blinkAnim }}>
                <Icon name="arrow-left-bold" size={36} color="#facc15" />
              </Animated.View>
              <Text style={styles.timeText}>{time || '--:--'}</Text>
              <Animated.View style={{ opacity: blinkAnim }}>
                <Icon name="arrow-right-bold" size={36} color="#facc15" />
              </Animated.View>
            </View>

            {/* Headlights, Hazard, Low Beam */}
            <View style={styles.topStatusRow}>
              <Icon
                name="car-light-high"
                size={28}
                color={headlightStatus?.high ? '#3b82f6' : '#1e293b'}
              />
              <View style={styles.iconBox}>
                <Icon name="hazard-lights" size={30} color="red" />
              </View>
              <Icon
                name="car-light-dimmed"
                size={28}
                color={headlightStatus?.low ? '#3b82f6' : '#1e293b'}
              />
            </View>

            {/* Gear & Battery Info */}
            <View style={styles.cornerInfoRow}>
  <View style={styles.leftSide}>
    <GearSelector gear={gear ?? 'n'} />
  </View>

  <View style={styles.rightSide}>
    <BatteryIndicator level={batteryPercentage ?? 0} horizontal={false} />
    <Text style={styles.value}>{batteryPercentage ?? '--'}%</Text>
  </View>
</View>

            {/* Speed */}
            <View style={styles.speedContainer}>
              <Text style={styles.speedText}>{speed ?? '--'}</Text>
              <Text style={styles.kmph}>km/h</Text>
            </View>

            {/* ECO & SPORTS Row */}
            <View style={styles.modeRow}>
              <View style={[styles.iconBox, { alignItems: 'center' }]}>
                <Icon name="leaf" size={36} color="#10b981" />
                <Text style={[styles.modeText, mode === 'eco' && styles.activeEcoText]}>
                  ECO
                </Text>
              </View>
              <View style={styles.modeBlock}>
                <View style={[styles.iconBox, { alignItems: 'center' }]}>
                  <Icon name="lightning-bolt" size={36} color="#f43f5e" />
                  <Text style={[styles.modeText, mode === 'sports' && styles.activeSportText]}>
                    SPORTS
                  </Text>
                </View>
              </View>
            </View>

            {/* Range & Odometer Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricBoxLeft}>
  <Icon name="map-marker-distance" size={36} color="#60a5fa" />
  <View style={{ alignItems: 'center' }}>
    <Text style={styles.metricText}>Range</Text>
    <Text style={styles.metricText}>{range ?? '--'} km</Text>
  </View>
</View>

<View style={styles.metricBoxRight}>
  <Icon name="speedometer" size={36} color="#60a5fa" />
  <View style={{ alignItems: 'center' }}>
    <Text style={styles.metricText}>Odo</Text>
    <Text style={styles.metricText}>
  {odometer ? odometer.toFixed(1) : '--'} km
</Text>
  </View>
</View>
            </View>

            {/* Vertical Status Column */}
            <View style={styles.verticalStatusColumn}>
              <Icon name="car-brake-parking" size={24} color="#f87171" />
              <Icon name="car-brake-fluid-level" size={24} color={brakeStatus?.bf ? '#f87171' : '#6b7280'} />
              <Icon name="car-brake-hold" size={24} color={brakeStatus?.hb ? '#f87171' : '#6b7280'} />
              <Icon name="car-brake-alert" size={24} color={brakeStatus?.s ? '#f87171' : '#6b7280'} />
              <Icon name="wrench-clock" size={24} color={headlightStatus?.service ? '#f87171' : '#6b7280'} />
            </View>
          </View>
        </View>
        
        <BottomNavBar />
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 12,
    paddingBottom: 0,
  },
  scrollContainer: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 4,
  },
  timeText: {
    fontSize: 18,
    color: '#fff',
  },
  topStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginBottom: 8,
  },
  cornerInfoRow: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  paddingHorizontal: width * 0.1,
  marginTop: height * 0.02, // relative top spacing
},

leftSide: {
  alignItems: 'flex-start',
},

rightSide: {
  alignItems: 'flex-end',
},
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  speedContainer: {
  alignItems: 'center',
  marginTop: -80, // was -50 or less (move closer to CurvedPartitionLines)
},
  speedText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  kmph: {
    fontSize: 14,
    color: '#ccc',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 18,
    marginBottom: 6,
  },
  modeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  modeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  activeEcoText: {
    color: '#10b981',
  },
  activeSportText: {
    color: '#f43f5e',
  },
  metricsRow: {
  position: 'absolute',
  bottom: 15, // place it just above BottomNavBar (adjust if needed)
  width: '100%',
  flexDirection: 'row',
  justifyContent: 'space-around',
  paddingHorizontal: 0,
},
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricBoxLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  transform: [{ translateX: -50 }], // shift right (closer to center)
},

metricBoxRight: {
  flexDirection: 'row',
  alignItems: 'center',
  transform: [{ translateX: 38 }], // shift left (closer to center)
},
  metricText: {
    fontSize: 18,
    color: '#e5e7eb',
  },
  verticalStatusColumn: {
    position: 'absolute',
    right: 8,
    top: 90,
    justifyContent: 'space-between',
    height: 120,
  },
  iconBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    padding: 10,
    marginHorizontal: 2,
    backgroundColor: 'transparent',
  },
});

export default VehicleDashboardUI;