import React from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { Brand } from '@/constants/theme';

type FieldProps = TextInputProps & {
  label: string;
};

export function Field({ label, style, ...rest }: FieldProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={Brand.faint}
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 14,
  },
  label: {
    color: Brand.muted,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    backgroundColor: Brand.surfaceRaised,
    borderColor: Brand.border,
    borderWidth: 1,
    borderRadius: Brand.radiusSm,
    color: Brand.text,
    fontSize: 15,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
});
