// MotorHealth.tsx
import React, { useContext, useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StatusBar,
  Animated,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BarChart } from 'react-native-gifted-charts';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import BottomNavBar from '../components/BottomNavBar';
import styles from './MotorHealthStyles';

const screenWidth = Dimensions.get('window').width;
const RADIUS = 75;
const CIRCLE_LENGTH = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const MotorHealth = () => {
  const { data = {} } = useContext(BatteryBluetoothContext);
  const mcu1 = data.messageMCU1 || {};
  const mcu2 = data.messageMCU2 || {};
  const mcu3 = data.messageMCU3 || {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const strokeAnim = useRef(new Animated.Value(0)).current;

  const [rpm, setRpm] = useState(0);

  useEffect(() => {
    setRpm(mcu2.motorRPM || 0);
  }, [data]);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
      }),
      Animated.timing(strokeAnim, {
        toValue: rpm / 100, // Normalizing to 0–100 range
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [rpm]);

  const strokeDashoffset = strokeAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCLE_LENGTH, 0],
  });

  const performanceData = [
    {
      value: mcu1.speed || 0,
      label: 'Speed',
      frontColor: '#60a5fa',
      gradientColor: '#3b82f6',
    },
    {
      value: mcu1.throttle || 0,
      label: 'Throttle',
      frontColor: '#34d399',
      gradientColor: '#059669',
    },
    {
      value: mcu1.rmsCurrent || 0,
      label: 'RMS Curr',
      frontColor: '#f472b6',
      gradientColor: '#ec4899',
    },
  ];

  return (
    <LinearGradient
      colors={['#0a0f1c', '#1f2937', '#111827']}
      style={styles.container}>
      <StatusBar barStyle="light-content" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Circular RPM */}
        <Animated.View
          style={[styles.socRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
        >
          <View style={styles.svgContainer}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              <Circle
                cx="90"
                cy="90"
                r={RADIUS}
                stroke="#2d3748"
                strokeWidth="12"
                fill="none"
              />
              <AnimatedCircle
                cx="90"
                cy="90"
                r={RADIUS}
                stroke="#f472b6"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${CIRCLE_LENGTH}, ${CIRCLE_LENGTH}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin="90, 90"
              />
            </Svg>
            <Text style={styles.svgText}>{rpm} RPM</Text>
          </View>
          <View style={styles.socRight}>
            <Text style={styles.socText}>{rpm} RPM</Text>
            <Text style={styles.metricLabel}>Motor RPM</Text>
          </View>
        </Animated.View>

        {/* Performance Bar Chart */}
        <View style={{ marginTop: 30, marginBottom: 20 }}>
          <BarChart
            data={performanceData}
            width={screenWidth - 220}
            height={130}
            barWidth={100}
            noOfSections={5}
            spacing={30}
            initialSpacing={10}
            isAnimated
            animationDuration={800}
            yAxisLabelTexts={['0', '20', '40', '60', '80', '100']}
            yAxisTextStyle={{ color: '#94a3b8' }}
            xAxisLabelTextStyle={{ color: '#94a3b8' }}
          />
        </View>

        {/* Metrics Grid */}
        <View style={styles.gridContainer}>
          {[
            ['thermometer', 'Controller Temp', mcu1.controllerTemperature, '°C', '#f87171'],
            ['fire', 'Motor Temp', mcu1.motorTemperature, '°C', '#fb923c'],
            ['battery-charging', 'Capacitor V', mcu2.capacitorVoltage, 'V', '#60a5fa'],
            ['map-marker-distance', 'Odometer', mcu2.odometer, 'km', '#34d399'],
            ['car-brake-abs', 'Brake', mcu1.brake, '%', '#facc15'],
            ['steering', 'Drive Mode', mcu1.driveMode, '', '#f472b6'],
          ].map(([icon, label, val, unit, color], idx) => (
            <View key={idx} style={styles.gridItem}>
              <Icon name={icon as string} size={32} color={color as string} />
              <Text style={styles.metricText}>{label}</Text>
              <Text style={styles.metricValue}>{val} {unit}</Text>
            </View>
          ))}
        </View>

        {/* Faults */}
        <View style={styles.faultContainer}>
          {(mcu3.faultMessages || ['No Faults']).map((fault: string, idx: number) => (
            <Text key={idx} style={styles.faultText}>• {fault}</Text>
          ))}
        </View>
      </ScrollView>

      <BottomNavBar />
    </LinearGradient>
  );
};

export default MotorHealth;