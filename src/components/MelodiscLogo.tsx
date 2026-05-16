import React from 'react';
import { View, StyleSheet } from 'react-native';

type MelodiscLogoProps = {
  size?: number;
  accentColor?: string;
};

/**
 * Static 2D vinyl disc logo for Melodisc branding.
 * Renders concentric circles mimicking vinyl record grooves with the app accent color.
 */
export function MelodiscLogo({
  size = 64,
  accentColor = '#BDEBFF',
}: MelodiscLogoProps) {
  const half = size / 2;

  return (
    <View
      style={[
        styles.disc,
        {
          width: size,
          height: size,
          borderRadius: half,
          borderColor: accentColor,
          backgroundColor: '#0A0A0F',
        },
      ]}
    >
      {/* Outer groove ring */}
      <View
        style={[
          styles.ring,
          {
            width: size * 0.82,
            height: size * 0.82,
            borderRadius: (size * 0.82) / 2,
            borderColor: `${accentColor}55`,
          },
        ]}
      >
        {/* Mid groove ring */}
        <View
          style={[
            styles.ring,
            {
              width: size * 0.64,
              height: size * 0.64,
              borderRadius: (size * 0.64) / 2,
              borderColor: `${accentColor}40`,
            },
          ]}
        >
          {/* Inner label area */}
          <View
            style={[
              styles.label,
              {
                width: size * 0.38,
                height: size * 0.38,
                borderRadius: (size * 0.38) / 2,
                backgroundColor: `${accentColor}18`,
                borderColor: `${accentColor}60`,
              },
            ]}
          >
            {/* Spindle hole */}
            <View
              style={[
                styles.spindle,
                {
                  width: size * 0.1,
                  height: size * 0.1,
                  borderRadius: (size * 0.1) / 2,
                  backgroundColor: accentColor,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  disc: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  ring: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  label: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  spindle: {},
});
