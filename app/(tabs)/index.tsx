import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View } from 'react-native';
import * as Battery from 'expo-battery';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { Image } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';

export default function HomeScreen() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number>(25);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [tempLimit, setTempLimit] = useState<string>('30');
  const [unit, setUnit] = useState<'Celsius' | 'Fahrenheit'>('Celsius');
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [swipeOffset, setSwipeOffset] = useState<number>(0);
  const [monitoringPaused, setMonitoringPaused] = useState<boolean>(false);
  const [lastAlarmTemp, setLastAlarmTemp] = useState<number | null>(null);

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
      if (batteryState !== Battery.BatteryState.CHARGING) setAlarmActive(false);
    });

    return () => {
      batterySub.remove();
      chargingSub.remove();
    };
  }, []);

  useEffect(() => {
    if (!isCharging) {
      setTemperature(25);
      setMonitoringPaused(false);
      setLastAlarmTemp(null);
      return;
    }
    if (monitoringPaused) {
      if (lastAlarmTemp !== null && temperature >= lastAlarmTemp + 1) {
        setMonitoringPaused(false);
        setAlarmActive(true);
      }
      return;
    }
    const interval = setInterval(() => {
      setTemperature(prev => {
        const newTemp = prev + (Math.random() - 0.2);
        const limit = parseFloat(tempLimit);
        const tempInCelsius = unit === 'Fahrenheit' ? (newTemp - 32) * 5 / 9 : newTemp;
        const limitInCelsius = unit === 'Fahrenheit' ? (limit - 32) * 5 / 9 : limit;
        if (tempInCelsius > limitInCelsius && !alarmActive) {
          setAlarmActive(true);
          setLastAlarmTemp(newTemp);
        }
        return newTemp;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, [isCharging, tempLimit, unit, monitoringPaused, lastAlarmTemp, temperature]);

  const onSwipeHandler = (event: any) => {
    const { translationX, state } = event.nativeEvent;
    setSwipeOffset(translationX);
    if (state === State.END) {
      if (translationX > 100) {
        setAlarmActive(false);
        setMonitoringPaused(true);
        setLastAlarmTemp(temperature);
      }
      setSwipeOffset(0);
    }
  };

  const toggleUnit = () => {
    setUnit(unit === 'Celsius' ? 'Fahrenheit' : 'Celsius');
    setTempLimit(unit === 'Celsius' ? '86' : '30');
  };

  const tempDisplay = unit === 'Fahrenheit' ? (temperature * 9 / 5 + 32).toFixed(1) : temperature.toFixed(1);

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
            <ThemedText style={styles.limitLabel}>Set Temperature Limit in {unit}:</ThemedText>
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

      {alarmActive && isCharging && (
        <View style={styles.alarmOverlay}>
          <ThemedText type="title" style={styles.alarmText}>
            Battery Temperature Limit Reached!
          </ThemedText>
          <ThemedText style={styles.alarmSubText}>
            Current Temperature: {tempDisplay}°{unit === 'Celsius' ? 'C' : 'F'}
          </ThemedText>
          <ThemedText style={styles.alarmSubText}>
            UNPLUG THE CHARGER NOW
          </ThemedText>
          <PanGestureHandler
            onGestureEvent={onSwipeHandler}
            onHandlerStateChange={onSwipeHandler}
          >
            <View style={[styles.swipeArea, { transform: [{ translateX: swipeOffset }] }]}>
              <ThemedText style={styles.swipeText}>Swipe Right to Dismiss</ThemedText>
            </View>
          </PanGestureHandler>
          <ThemedText style={styles.alarmSubText}>Or disconnect charger to stop</ThemedText>
        </View>
      )}
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
    justifyContent: 'center', // Center the row
    flexWrap: 'wrap', // Allow wrapping if needed
    gap: 8,
    marginTop: 16,
    width: '100%', // Ensure it fits container width
  },
  limitLabel: {
    fontSize: 16, // Slightly smaller to fit
    flexShrink: 1, // Allow text to shrink if needed
    textAlign: 'right', // Align text for better flow
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
  alarmOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ff4444',
    zIndex: 1000,
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
    alignSelf: 'center',
  },
  swipeText: {
    fontSize: 16,
    color: '#000',
  },
});