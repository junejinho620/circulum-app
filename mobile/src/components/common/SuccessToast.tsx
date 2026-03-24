import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  message: string;
  visible: boolean;
  onDone?: () => void;
  duration?: number;
  icon?: string;
};

export default function SuccessToast({
  message, visible, onDone, duration = 2000, icon = 'checkmark-circle',
}: Props) {
  const translateY = useRef(new Animated.Value(-60)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, tension: 80, friction: 10, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 10, useNativeDriver: true }),
      ]).start();

      const t = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, { toValue: -60, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 250, useNativeDriver: true }),
        ]).start(() => onDone?.());
      }, duration);

      return () => clearTimeout(t);
    } else {
      translateY.setValue(-60);
      opacity.setValue(0);
      scale.setValue(0.85);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[s.wrap, { opacity, transform: [{ translateY }, { scale }] }]}
    >
      <View style={s.pill}>
        <Ionicons name={icon as any} size={16} color="#fff" />
        <Text style={s.text}>{message}</Text>
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(17, 17, 17, 0.82)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 99,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
});
