import React from 'react';
import {Animated, Image, StyleSheet} from 'react-native';

const splashImage = require('../assets/splash.jpg');

interface Props {
  opacity: Animated.Value;
}

export default function SplashScreen({opacity}: Props) {
  return (
    <Animated.View pointerEvents="none" style={[styles.container, {opacity}]}>
      <Image source={splashImage} style={styles.image} resizeMode="contain" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0D1B38',
    zIndex: 9999,
    elevation: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
