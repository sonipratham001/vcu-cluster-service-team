import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  SafeAreaView,
  Image,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GearSelector from '../components/GearSelector';
import BatteryIndicator from '../components/BatteryIndicator';
import BottomNavBar from '../components/BottomNavBar';
import LinearGradient from 'react-native-linear-gradient';
import BlueGlow from '../components/BlueGlow';
import RedOuterBorder from '../components/DesignLines';
import StatusIndicator from '../components/StatusIndicator';
import ModeButton from '../components/ModeButton';
import GlowingImage from '../components/GlowingImage';
const {width, height} = Dimensions.get('window');

interface VehicleDashboardUIProps {
  speed?: number;
  time?: string;
  batteryPercentage?: number;
  gear?: 'f' | 'n' | 'r';
  mode?: 'eco' | 'sports';
  range?: number;
  odometer?: number;
  leftSignal?: boolean;
rightSignal?: boolean;
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
  batteryHasFault?: boolean;
motorHasFault?: boolean;
glowColor?: string;
  glowIntensity?: number;
}

const VehicleDashboardUI: React.FC<VehicleDashboardUIProps> = ({
  speed,
  time,
  batteryPercentage,
  gear,
  mode,
  range,
  odometer,
  leftSignal,
  rightSignal,
  brakeStatus,
  isConnected,
  headlightStatus,
  batteryHasFault,
  motorHasFault,
  glowColor,
  glowIntensity
}) => {

  const leftBlinkAnim = useRef(new Animated.Value(1)).current;
const rightBlinkAnim = useRef(new Animated.Value(1)).current;

const leftAnimRef = useRef<Animated.CompositeAnimation | null>(null);
const rightAnimRef = useRef<Animated.CompositeAnimation | null>(null);

useEffect(() => {
  if (leftSignal) {
    leftAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(leftBlinkAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(leftBlinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    leftAnimRef.current.start();
  } else {
    if (leftAnimRef.current) {
      leftAnimRef.current.stop();
      leftAnimRef.current = null;
    }
    // Reset using an animated timing instead of setValue directly
    Animated.timing(leftBlinkAnim, {
      toValue: 1,
      duration: 100, // short reset animation
      useNativeDriver: true,
    }).start();
  }
}, [leftSignal]);

useEffect(() => {
  if (rightSignal) {
    rightAnimRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(rightBlinkAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(rightBlinkAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ])
    );
    rightAnimRef.current.start();
  } else {
    if (rightAnimRef.current) {
      rightAnimRef.current.stop();
      rightAnimRef.current = null;
    }
    Animated.timing(rightBlinkAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
  }
}, [rightSignal]);
  return (
    <LinearGradient
      colors={['#0a0f1c', '#1f2937', '#111827']}
      style={{flex: 1}}>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.scrollContainer}>
          {/* <CurvedPartitionLines /> */}
          <RedOuterBorder />
          <BlueGlow glowColor={glowColor} glowIntensity={glowIntensity} />
          <View style={styles.container}>
            {/* Turn Signals Row */}
            <View style={styles.topRow}>
  <Animated.View style={{opacity: leftBlinkAnim, marginLeft: 2}}>
    <Icon name="arrow-left-bold" size={56} color="#facc15" />
  </Animated.View>

  <View style={styles.timeContainer}>
    <Text style={styles.digitalTimeText}>{time || '--:--'}</Text>
  </View>

  
<Animated.View style={{opacity: rightBlinkAnim, marginRight: 2}}>
    <Icon name="arrow-right-bold" size={56} color="#facc15" />
  </Animated.View>
</View>

              
            <View style={styles.logoWithStatusRow}>
  <View style={styles.logoContainer}>
    <Image
      source={require('../../assets/intuteLogo.png')}
      style={styles.logo}
      resizeMode="contain"
    />
  </View>
</View>

            

            {/* Headlights, Hazard, Low Beam */}
            <View style={styles.topStatusRow}>
              <Icon
                name="car-light-high"
                size={48}
                color={headlightStatus?.high ? '#3b82f6' : '#1e293b'}
                style={{ transform: [{ translateY: -height * 0.18 }, { translateX: -20 }] }}
              />
              <Icon
                name="car-light-dimmed"
                size={48}
                color={headlightStatus?.low ? '#3b82f6' : '#1e293b'}
                style={{ transform: [{ translateY: -height * 0.18 }, { translateX: 20 }] }}
              />
            </View>

            {/* Gear & Battery Info */}
            <View style={styles.cornerInfoRow}>
              <View style={styles.leftSide}>
                <GearSelector gear={gear ?? 'n'} />
              </View>

              <View style={styles.rightSide}>
                <BatteryIndicator
                  level={batteryPercentage ?? 0}
                  horizontal={false}
                />
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
              <ModeButton
  active={mode === 'eco'}
  icon="leaf"
  label="ECO"
  defaultColor="#10b981" // Tailwind green-500
/>

<ModeButton
  active={mode === 'sports'}
  icon="lightning-bolt"
  label="SPORTS"
  defaultColor="#ef4444" // Tailwind red-500
/>
            </View>

            {/* Range & Odometer Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricBoxLeft}>
                <Icon name="map-marker-distance" size={36} color="#60a5fa" />
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.metricText}>Range</Text>
                  <Text style={styles.metricText}>{range ?? '--'} km</Text>
                </View>
              </View>

              <View style={styles.metricBoxRight}>
                <Icon name="speedometer" size={36} color="#60a5fa" />
                <View style={{alignItems: 'center'}}>
                  <Text style={styles.metricText}>Odo</Text>
                  <Text style={styles.metricText}>
                    {odometer ? odometer.toFixed(1) : '--'} km
                  </Text>
                </View>
              </View>
            </View>

            {/* Vertical Status Column */}
            <View style={styles.verticalStatusColumn}>
  <View style={styles.statusIconBox}>
    <Icon name="car-brake-parking" size={28} color="#f87171" />
  </View>

  <View style={styles.statusIconBox}>
    <GlowingImage
      source={require('../../assets/brake-pad-warning.png')}
      glowColor="#f87171"
      active={!!brakeStatus?.bf}
      size={130}
    />
  </View>

  <View style={styles.statusIconBox}>
    <StatusIndicator
      iconName="battery-charging-high"
      status={batteryHasFault ? 'fault' : 'ok'}
    />
  </View>

  <View style={styles.statusIconBox}>
    <StatusIndicator
      iconName="engine-outline"
      status={motorHasFault ? 'fault' : 'ok'}
    />
  </View>
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
    padding: 2,
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
    marginTop: 2,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
 timeContainer: {
  backgroundColor: 'rgba(255, 255, 255, 0.08)',
  paddingVertical: 0,
  paddingHorizontal: 12,
  borderRadius: 4,
  borderWidth: 1.5,
  borderColor: '#ffffffaa',
  shadowColor: '#0ea5e9',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.5,
  shadowRadius: 2,
  elevation: 2,
  alignSelf: 'center',     // ensures tight fit
  alignItems: 'center',    // centers the text inside
  justifyContent: 'center' // vertically center it
},

digitalTimeText: {
  fontSize: 22,
  fontWeight: 'bold',
  color: '#f1f5f9',
  letterSpacing: 2,
  fontVariant: ['tabular-nums'],
  textShadowColor: '#38bdf8',
  textShadowOffset: { width: 0, height: 0 },
  textShadowRadius: 2,
},
  topStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 144,
  },
  cornerInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: width * 0.1,
    marginTop: height * 0.02,
  },

  leftSide: {
    alignItems: 'flex-start',
    transform: [{translateY: -50}, {translateX: 20}],
  },

  rightSide: {
    alignItems: 'flex-end',
    transform: [{translateY: -50}, {translateX: -20}],
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
    marginTop: 2,
  },
  speedContainer: {
    alignItems: 'center',
    marginTop: -height * 0.41,
  },
  speedText: {
    fontSize: 68,
    fontWeight: 'bold',
    color: '#fff',
  },
  kmph: {
    fontSize: 18,
    color: '#ccc',
  },
  modeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: width * 0.08,         // dynamic horizontal gap
  marginTop: -height * 0.03, // slight upward shift
  marginBottom: height * 0.07,
  },
  modeBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusIconBox: {
  height: 40,     // Set equal or greater than the largest icon
  width: 40,
  justifyContent: 'center',
  alignItems: 'center',
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
    bottom: 38, 
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: -60,
  },
  metricBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricBoxLeft: {
    flexDirection: 'row',
    alignItems: 'center',
      transform: [{translateX: -width * 0.15}], 
  },

  metricBoxRight: {
    flexDirection: 'row',
    alignItems: 'center',
    transform: [{ translateX: width * 0.13 }],
  },
  metricText: {
    fontSize: 18,
    color: '#e5e7eb',
  },
  verticalStatusColumn: {
  position: 'absolute',
  right: width * 0.02,
  top: height * 0.20,
  justifyContent: 'space-between',
  alignItems: 'center',   // 👈 this is critical
  height: height * 0.18,
},
  iconBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 40,
    marginHorizontal: 6,
    backgroundColor: 'transparent',
  },
  logoContainer: {
    alignItems: 'center',
    marginVertical: 4,
  },
  logo: {
    width: 200,
    height: 60,
  },
  logoWithStatusRow: {
  flexDirection: 'row',
  justifyContent: 'space-around',
  alignItems: 'center',
  marginTop: -18,
  paddingHorizontal: 24,
  zIndex: 2,
},
});

export default VehicleDashboardUI;