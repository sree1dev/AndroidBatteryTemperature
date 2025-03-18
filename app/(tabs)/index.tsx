import React, { useState, useEffect } from 'react';
import { StyleSheet, Alert, View, Modal, TouchableOpacity } from 'react-native';
import * as Battery from 'expo-battery';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Image, TextInput } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';

export default function HomeScreen() {
  const [batteryLevel, setBatteryLevel] = useState(null);
  const [temperature, setTemperature] = useState(25); // Simulated temperature
  const [isCharging, setIsCharging] = useState(false);
  const [tempLimit, setTempLimit] = useState('30'); // Default limit in Celsius
  const [unit, setUnit] = useState('Celsius'); // Celsius or Fahrenheit
  const [alarmActive, setAlarmActive] = useState(false);
  const [swipeOffset, setSwipeOffset] = useState(0);

  // Monitor charging status and battery level
  useEffect(() => {
    const checkCharging = async () => {
      const state = await Battery.getBatteryStateAsync();
      setIsCharging(state === Battery.BatteryState.CHARGING);
      const level = await Battery.getBatteryLevelAsync();
      setBatteryLevel(Math.round(level * 100));
    };
    checkCharging();

    const batterySub = Battery.addBatteryLevelListener(({ batteryLevel }) => {
      setBatteryLevel(Math.round(batteryLevel * 100));
    });
    const chargingSub = Battery.addBatteryStateListener(({ batteryState }) => {
      setIsCharging(batteryState === Battery.BatteryState.CHARGING);
      if (batteryState !== Battery.BatteryState.CHARGING) setAlarmActive(false); // Stop alarm if unplugged
    });

    return () => {
      batterySub.remove();
      chargingSub.remove();
    };
  }, []);

  // Simulate temperature when charging
  useEffect(() => {
    if (!isCharging) {
      setTemperature(25); // Reset to ambient when not charging
      return;
    }
    const interval = setInterval(() => {
      setTemperature(prev => {
        const newTemp = prev + (Math.random() - 0.2); // Gradual increase while charging
        const limit = parseFloat(tempLimit);
        const tempInCelsius = unit === 'Fahrenheit' ? (newTemp - 32) * 5 / 9 : newTemp;
        const limitInCelsius = unit === 'Fahrenheit' ? (limit - 32) * 5 / 9 : limit;
        if (tempInCelsius > limitInCelsius && !alarmActive) {
          setAlarmActive(true);
        }
        return newTemp;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isCharging, tempLimit, unit]);

  // Swipe handler to dismiss alarm
  const onSwipe = (event) => {
    const { translationX } = event.nativeEvent;
    setSwipeOffset(translationX);
    if (translationX > 100) { // Swipe right > 100px to dismiss
      setAlarmActive(false);
      setSwipeOffset(0);
    }
  };

  const toggleUnit = () => {
    setUnit(unit === 'Celsius' ? 'Fahrenheit' : 'Celsius');
    setTempLimit(unit === 'Celsius' ? '86' : '30'); // Default conversions
  };

  const tempDisplay = unit === 'Fahrenheit' ? (temperature * 9 / 5 + 32).toFixed(1) : temperature.toFixed(1);
  const limitDisplay = unit === 'Fahrenheit' ? (parseFloat(tempLimit) * 9 / 5 + 32).toFixed(1) : tempLimit;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ParallaxScrollView
        headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
        headerImage={
          <Image
            source={require('@/assets/images/partial-react-logo.png')}
            style={styles.reactLogo}
          />
        }>
        <ThemedView style={styles.container}>
          <ThemedText type="title">Temperature Alarm</ThemedText>
          {!isCharging ? (
            <ThemedText style={styles.text}>Connect charger to start monitoring</ThemedText>
          ) : (
            <>
              <ThemedText style={styles.text}>
                Battery Level: {batteryLevel !== null ? `${batteryLevel}%` : 'Loading...'}
              </ThemedText>
              <ThemedText style={styles.text}>
                Temperature: {tempDisplay}°{unit === 'Celsius' ? 'C' : 'F'}
              </ThemedText>
            </>
          )}
          <ThemedView style={styles.inputContainer}>
            <ThemedText>Set Limit ({unit}): </ThemedText>
            <TextInput
              style={styles.input}
              value={tempLimit}
              onChangeText={setTempLimit}
              keyboardType="numeric"
              placeholder={`Enter ${unit} limit`}
            />
            <TouchableOpacity onPress={toggleUnit} style={styles.unitButton}>
              <ThemedText>Switch to {unit === 'Celsius' ? 'Fahrenheit' : 'Celsius'}</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </ThemedView>
      </ParallaxScrollView>

      {/* Full-Screen Alarm Modal */}
      <Modal visible={alarmActive && isCharging} animationType="slide" transparent={false}>
        <ThemedView style={styles.alarmContainer}>
          <ThemedText type="title" style={styles.alarmText}>
            Battery Temperature Limit Reached!
          </ThemedText>
          <ThemedText style={styles.alarmSubText}>
            Current Temperature: {tempDisplay}°{unit === 'Celsius' ? 'C' : 'F'}
          </ThemedText>
          <PanGestureHandler onGestureEvent={onSwipe}>
            <ThemedView style={[styles.swipeArea, { transform: [{ translateX: swipeOffset }] }]}>
              <ThemedText style={styles.swipeText}>Swipe Right to Dismiss</ThemedText>
            </ThemedView>
          </PanGestureHandler>
          <ThemedText style={styles.alarmSubText}>Or disconnect charger to stop</ThemedText>
        </ThemedView>
      </Modal>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    gap: 8,
  },
  text: {
    marginTop: 16,
    fontSize: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    width: 100,
    textAlign: 'center',
  },
  unitButton: {
    padding: 8,
    backgroundColor: '#ddd',
    borderRadius: 4,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  alarmContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4444',
  },
  alarmText: {
    color: '#fff',
    fontSize: 28,
    textAlign: 'center',
  },
  alarmSubText: {
    color: '#fff',
    fontSize: 20,
    marginVertical: 16,
  },
  swipeArea: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    width: 200,
    alignItems: 'center',
  },
  swipeText: {
    fontSize: 16,
    color: '#000',
  },
});