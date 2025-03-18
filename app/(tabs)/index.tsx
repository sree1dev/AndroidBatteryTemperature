import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, TextInput, View, Platform, PermissionsAndroid, Animated } from 'react-native';
import * as Battery from 'expo-battery';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { useColorScheme } from 'react-native';
import { GestureHandlerRootView, PanGestureHandler, State } from 'react-native-gesture-handler';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

export default function HomeScreen() {
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [temperature, setTemperature] = useState<number>(25);
  const [isCharging, setIsCharging] = useState<boolean>(false);
  const [tempLimit, setTempLimit] = useState<string>('30');
  const [unit, setUnit] = useState<'Celsius' | 'Fahrenheit'>('Celsius');
  const [alarmActive, setAlarmActive] = useState<boolean>(false);
  const [swipeOffset, setSwipeOffset] = useState(new Animated.Value(0));
  const [monitoringPaused, setMonitoringPaused] = useState<boolean>(false);
  const [lastAlarmTemp, setLastAlarmTemp] = useState<number | null>(null);
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(colorScheme === 'dark');

  useEffect(() => {
    requestPermissions();
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
    swipeOffset.setValue(translationX);
    if (state === State.END) {
      if (translationX > 100) {
        setAlarmActive(false);
        setMonitoringPaused(true);
        setLastAlarmTemp(temperature);
      }
      Animated.spring(swipeOffset, { toValue: 0, useNativeDriver: true }).start();
    }
  };

  const toggleUnit = () => {
    setUnit(unit === 'Celsius' ? 'Fahrenheit' : 'Celsius');
    setTempLimit(unit === 'Celsius' ? '86' : '30');
  };

  const toggleTheme = () => setIsDarkMode(prev => !prev);

  const tempDisplay = unit === 'Fahrenheit' ? (temperature * 9 / 5 + 32).toFixed(1) : temperature.toFixed(1);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SYSTEM_ALERT_WINDOW,
          {
            title: 'Overlay Permission',
            message: 'This app needs permission to display over other apps.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          console.log('Overlay permission granted');
        } else {
          console.log('Overlay permission denied');
        }
      } catch (err) {
        console.warn(err);
      }
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemedView style={[styles.container, isDarkMode ? styles.darkContainer : styles.lightContainer]}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeToggle, isDarkMode ? styles.darkButton : styles.lightButton]}
          >
            <ThemedText
              style={[
                styles.themeText,
                { color: isDarkMode ? '#ffffff' : '#000000' },
              ]}
            >
              {isDarkMode ? 'Light' : 'Dark'} Mode
            </ThemedText>
          </TouchableOpacity>
          <ThemedText
            type="title"
            style={[
              styles.title,
              { color: isDarkMode ? '#ffffff' : '#000000' },
            ]}
          >
            Battery Temperature Alarm
          </ThemedText>
        </View>
        <View style={styles.mainContent}>
          <ThemedText
            style={[
              styles.percentage,
              { color: isDarkMode ? '#ffffff' : '#000000' },
            ]}
          >
            {batteryLevel !== null ? `${batteryLevel}%` : 'Loading...'}
          </ThemedText>
          <ThemedText
            style={[
              styles.tempText,
              { color: isDarkMode ? '#ffffff' : '#000000' },
            ]}
          >
            Temp: {tempDisplay}°{unit}
          </ThemedText>
          <ThemedView style={styles.inputContainer}>
            <ThemedText
              style={[
                styles.limitLabel,
                { color: isDarkMode ? '#ffffff' : '#000000' },
              ]}
            >
              Set Temperature Limit ({unit}):
            </ThemedText>
            <TextInput
              style={[styles.input, isDarkMode ? styles.darkInput : styles.lightInput]}
              value={tempLimit}
              onChangeText={setTempLimit}
              keyboardType="numeric"
              placeholder={`Enter ${unit} limit`}
              placeholderTextColor={isDarkMode ? '#ffffff' : '#000000'}
            />
            <TouchableOpacity
              onPress={toggleUnit}
              style={[styles.unitButton, isDarkMode ? styles.darkButton : styles.lightButton]}
            >
              <ThemedText
                style={[
                  styles.buttonText,
                  { color: isDarkMode ? '#ffffff' : '#000000' },
                ]}
              >
                Switch to {unit === 'Celsius' ? 'Fahrenheit' : 'Celsius'}
              </ThemedText>
            </TouchableOpacity>
          </ThemedView>
        </View>
      </ThemedView>

      {alarmActive && isCharging && (
        <View style={styles.alarmOverlay}>
          <ThemedText type="title" style={styles.alarmText}>
            Battery Temperature Limit Reached!
          </ThemedText>
          <ThemedText style={styles.alarmSubText}>
            Current Temperature: {tempDisplay}°{unit}
          </ThemedText>
          <ThemedText style={styles.alarmSubText}>UNPLUG THE CHARGER NOW</ThemedText>
          <View style={styles.swipeContainer}>
            <PanGestureHandler onGestureEvent={onSwipeHandler} onHandlerStateChange={onSwipeHandler}>
              <Animated.View style={[styles.swipeButton, { transform: [{ translateX: swipeOffset }] }]}>
                <ThemedText style={styles.swipeText}>→</ThemedText>
                <View style={styles.lightRow}>
                  {[0, 1, 2].map(index => (
                    <View key={index} style={styles.light} />
                  ))}
                </View>
              </Animated.View>
            </PanGestureHandler>
          </View>
          <ThemedText style={styles.alarmSubText}>Or disconnect charger to stop</ThemedText>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60, // Ensure content stays below status bar
  },
  lightContainer: {
    backgroundColor: '#ffffff', // White background for light mode
  },
  darkContainer: {
    backgroundColor: '#000000', // Pitch black background for dark mode
  },
  lightText: {
    color: '#000000', // Black text for white background
  },
  darkText: {
    color: '#ffffff', // White text for black background
  },
  header: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 20, // Space between header and main content
  },
  title: {
    fontSize: 24,
    marginTop: 10, // Space below toggle
  },
  themeToggle: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    elevation: 10, // Skeuomorphic elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    backgroundColor: '#f0f0f0', // Subtle gradient base
  },
  themeText: {
    fontSize: 14,
  },
  mainContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center', // Center vertically
    paddingVertical: 20, // Added vertical padding to ensure space
    paddingHorizontal: 20,
  },
  percentage: {
    fontSize: 25, // Further reduced to prevent cutoff
    marginBottom: 15,
    maxWidth: 200, // Prevent overflow
  },
  tempText: {
    fontSize: 24,
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  limitLabel: {
    fontSize: 16,
    flexShrink: 1,
    textAlign: 'right',
    minWidth: 140,
  },
  input: {
    borderWidth: 2,
    padding: 12,
    width: 80,
    textAlign: 'center',
    borderRadius: 20,
    elevation: 10, // Skeuomorphic elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    backgroundColor: '#f0f0f0', // Subtle gradient base
  },
  lightInput: {
    borderColor: '#000000',
    color: '#000000',
  },
  darkInput: {
    borderColor: '#ffffff',
    color: '#ffffff',
  },
  unitButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 10, // Skeuomorphic elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    backgroundColor: '#f0f0f0', // Subtle gradient base
  },
  lightButton: {
    backgroundColor: '#ffffff',
  },
  darkButton: {
    backgroundColor: '#000000',
  },
  buttonText: {
    fontSize: 16,
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
    color: '#ffffff',
    fontSize: 28,
    textAlign: 'center',
  },
  alarmSubText: {
    color: '#ffffff',
    fontSize: 20,
    marginVertical: 16,
  },
  swipeContainer: {
    width: 220,
    height: 60,
    backgroundColor: '#333',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  swipeButton: {
    width: 60,
    height: 60,
    backgroundColor: '#f0f0f0', // Subtle gradient base
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    elevation: 20, // Skeuomorphic elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  swipeText: {
    fontSize: 24,
    color: '#000000',
    marginRight: 4,
  },
  lightRow: {
    flexDirection: 'row',
  },
  light: {
    width: 8,
    height: 8,
    backgroundColor: '#00ff00',
    borderRadius: 4,
    marginHorizontal: 2,
  },
});