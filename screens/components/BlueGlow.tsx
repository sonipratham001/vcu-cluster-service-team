import React from 'react';
import Svg, { Defs, RadialGradient, Stop, Circle } from 'react-native-svg';
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const BlueGlow = () => {
  return (
    <Svg
      height={height}
      width={width}
      style={{ position: 'absolute', top: 0, left: 0 }}
    >
      <Defs>
        <RadialGradient
          id="grad"
          cx="50%"
          cy="95%"  
          rx="50%"
          ry="50%"
        >
          <Stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
          <Stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle
        cx={width / 2}
        cy={height * 0.15}
        r={width * 0.6}
        fill="url(#grad)"
      />
    </Svg>
  );
};

export default BlueGlow;