import React from 'react';
import { StyleSheet, View, type ViewProps } from 'react-native';

type LinearGradientPoint = {
  x: number;
  y: number;
};

type LinearGradientProps = ViewProps & {
  colors: readonly [string, string, ...string[]];
  end?: LinearGradientPoint | null;
  locations?: readonly [number, number, ...number[]] | null;
  start?: LinearGradientPoint | null;
};

function gradientAngle(start?: LinearGradientPoint | null, end?: LinearGradientPoint | null) {
  if (!start || !end) {
    return '180deg';
  }

  const radians = Math.atan2(end.y - start.y, end.x - start.x);
  return `${90 + (radians * 180) / Math.PI}deg`;
}

function colorStops(
  colors: readonly string[],
  locations?: readonly number[] | null,
) {
  return colors
    .map((color, index) => {
      const location = locations?.[index];
      return typeof location === 'number'
        ? `${color} ${Math.round(location * 100)}%`
        : color;
    })
    .join(', ');
}

export function LinearGradient({
  colors,
  end,
  locations,
  start,
  style,
  ...props
}: LinearGradientProps) {
  return (
    <View
      {...props}
      style={[
        style,
        {
          backgroundImage: `linear-gradient(${gradientAngle(start, end)}, ${colorStops(colors, locations)})`,
        } as ViewProps['style'],
      ]}
    />
  );
}

export default LinearGradient;
