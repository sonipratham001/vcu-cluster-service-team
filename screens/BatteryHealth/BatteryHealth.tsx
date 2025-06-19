import React, { useRef, useEffect, useContext, useState } from 'react';
import {
  View,
  Text,
  StatusBar,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { BarChart } from 'react-native-gifted-charts';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Circle } from 'react-native-svg';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BatteryBluetoothContext } from '../../services/BatteryBluetoothProvider';
import styles from './BatteryHealth.styles';
import BottomNavBar from '../components/BottomNavBar';

const screenWidth = Dimensions.get('window').width;
const RADIUS = 75;
const CIRCLE_LENGTH = 2 * Math.PI * RADIUS;

const BatteryHealth = () => {
  const { data = {} } = useContext(BatteryBluetoothContext);

  const messageDIU2 = data.messageDIU2 || {};
  const messageDIU3 = data.messageDIU3 || {};
  const messageDIU4 = data.messageDIU4 || {};
  const messageDriveParameters = data.messageDriveParameters || {};

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const strokeAnim = useRef(new Animated.Value(0)).current;

  const [batteryMetrics, setBatteryMetrics] = useState({
    soc: 0,
    batteryCurrent: 0,
    minCellVoltage: 0,
    maxCellVoltage: 0,
    maxCellTemp: 0,
    minCellTemp: 0,
    availableEnergy: 0,
    driveCurrentLimit: 0,
    regenCurrentLimit: 0,
    vehicleModeRequest: 0,
    keyOnIndicator: 0,
  });

  useEffect(() => {
    setBatteryMetrics({
      soc: messageDIU4.stateOfCharge || 0,
      batteryCurrent: messageDIU2.batteryCurrent || 0,
      minCellVoltage: messageDIU3.minCellVoltage || 0,
      maxCellVoltage: messageDIU3.maxCellVoltage || 0,
      maxCellTemp: messageDriveParameters.maxCellTemp || 0,
      minCellTemp: messageDriveParameters.minCellTemp || 0,
      availableEnergy: messageDriveParameters.availableEnergy || 0,
      driveCurrentLimit: messageDIU2.driveCurrentLimit || 0,
      regenCurrentLimit: messageDIU2.regenCurrentLimit || 0,
      vehicleModeRequest: messageDIU2.vehicleModeRequest || 0,
      keyOnIndicator: messageDIU4.keyOnIndicator || 0,
    });
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
        toValue: batteryMetrics.soc,
        duration: 1000,
        useNativeDriver: false,
      }),
    ]).start();
  }, [batteryMetrics.soc]);

  const strokeDashoffset = strokeAnim.interpolate({
    inputRange: [0, 100],
    outputRange: [CIRCLE_LENGTH, 0],
  });

  const barData = [
    {
      value: batteryMetrics.batteryCurrent,
      label: 'Battery Current',
      frontColor: '#00eaff',
      gradientColor: '#00aaff',
    },
    {
      value: batteryMetrics.availableEnergy,
      label: 'Available Energy',
      frontColor: '#00eaff',
      gradientColor: '#00aaff',
    },
  ];

  return (
    <LinearGradient
      colors={['#0a0f1c', '#1f2937', '#111827']}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Circular SOC */}
        <Animated.View style={[styles.socRow, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.svgContainer}>
            <Svg width={180} height={180} viewBox="0 0 180 180">
              <Circle cx="90" cy="90" r={RADIUS} stroke="#2d3748" strokeWidth="12" fill="none" />
              <AnimatedCircle
                cx="90"
                cy="90"
                r={RADIUS}
                stroke="#00ff88"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${CIRCLE_LENGTH}, ${CIRCLE_LENGTH}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                rotation="-90"
                origin="90, 90"
              />
            </Svg>
            <Text style={styles.svgText}>{batteryMetrics.soc}%</Text>
          </View>
          <View style={styles.socRight}>
            <Text style={styles.socText}>{batteryMetrics.soc}%</Text>
            <Text style={styles.metricLabel}>State of Charge</Text>
          </View>
        </Animated.View>

        {/* Min/Max Voltage + Bar */}
        <View style={styles.row}>
          <View style={styles.metricBox}>
            <Icon name="flash" size={32} color="#fbbf24" />
            <Text style={styles.metricText}>Min Voltage</Text>
            <Text style={styles.metricValue}>{batteryMetrics.minCellVoltage} V</Text>
          </View>
          <View style={styles.metricBox}>
            <Icon name="flash-outline" size={32} color="#fbbf24" />
            <Text style={styles.metricText}>Max Voltage</Text>
            <Text style={styles.metricValue}>{batteryMetrics.maxCellVoltage} V</Text>
          </View>
        </View>

        <View style={{ marginTop: 30, marginBottom: 20 }}>
          <BarChart
            data={barData}
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

        {/* Grid Metrics */}
        <View style={styles.gridContainer}>
          {[
            ['thermometer-low', 'Min Temp', batteryMetrics.minCellTemp, '°C', '#f97316'],
            ['thermometer-high', 'Max Temp', batteryMetrics.maxCellTemp, '°C', '#ef4444'],
            ['car-electric', 'Drive Limit', batteryMetrics.driveCurrentLimit, 'A', '#c084fc'],
            ['recycle', 'Regen Limit', batteryMetrics.regenCurrentLimit, 'A', '#22c55e'],
            ['car', 'Vehicle Mode', String(batteryMetrics.vehicleModeRequest), '', '#38bdf8'],
            ['key', 'Key On', String(batteryMetrics.keyOnIndicator), '', '#fcd34d'],
          ].map(([icon, label, val, unit, color], idx) => (
            <View key={idx} style={styles.gridItem}>
              <Icon name={icon as string} size={32} color={color as string} />
              <Text style={styles.metricText}>{label}</Text>
              <Text style={styles.metricValue}>
                {val} {unit}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
      <BottomNavBar />
    </LinearGradient>
  );
};

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export default BatteryHealth;