import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { Brand } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps = PressableProps & {
  label: string;
  variant?: Variant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
};

const variantStyles: Record<Variant, ViewStyle> = {
  primary: { backgroundColor: Brand.accent },
  secondary: { backgroundColor: Brand.surfaceRaised, borderWidth: 1, borderColor: Brand.border },
  ghost: { backgroundColor: 'transparent' },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: Brand.danger },
};

const variantLabels: Record<Variant, TextStyle> = {
  primary: { color: '#06283B' },
  secondary: { color: Brand.text },
  ghost: { color: Brand.muted },
  danger: { color: Brand.danger },
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  labelStyle,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}>
      {loading ? (
        <ActivityIndicator size="small" color={variantLabels[variant].color as string} />
      ) : (
        <Text style={[styles.label, variantLabels[variant], labelStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Brand.radiusSm,
    paddingVertical: 14,
    paddingHorizontal: 18,
    minHeight: 48,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
});
