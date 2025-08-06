import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface ModeButtonProps {
  active: boolean;
  icon: string;
  label: string;
  defaultColor: string; // Green for ECO, Red for SPORTS
}

const ModeButton: React.FC<ModeButtonProps> = ({
  active,
  icon,
  label,
  defaultColor,
}) => {
  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: active ? defaultColor : 'transparent',
        },
      ]}>
      <Icon
        name={icon}
        size={36}
        color={active ? '#ffffff' : defaultColor}
      />
      <Text
        style={[
          styles.text,
          { color: active ? '#ffffff' : defaultColor },
        ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 32,
    marginHorizontal: 8,
    borderWidth: 1.5,
    borderColor: '#cbd5e1', // Always silver
  },
  text: {
    fontWeight: 'bold',
    fontSize: 11,
    marginTop: 2,
  },
});

export default ModeButton;