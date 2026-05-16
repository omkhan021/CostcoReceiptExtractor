import React from 'react';
import {Image} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import HomeScreen from '../screens/HomeScreen';
import SyncScreen from '../screens/SyncScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import type {AppStackParamList, AppTabParamList} from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

const SEARCH_ICON = require('../assets/icons/tab_search.png');
const RECEIPTS_ICON = require('../assets/icons/tab_receipts.png');

function Tabs() {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      initialRouteName="Sync"
      screenOptions={{
        tabBarActiveTintColor: '#005DAA', // Costco blue
        tabBarInactiveTintColor: '#888',
        headerShown: false,
        // Edge-to-edge on Android 15+ draws under the gesture/nav bar; lift
        // the tab bar by the bottom inset so its buttons stay tappable.
        tabBarStyle: {
          paddingBottom: insets.bottom,
          height: 56 + insets.bottom,
        },
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: ({color, size}) => (
            <Image
              source={SEARCH_ICON}
              style={{width: size, height: size, tintColor: color}}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{
          tabBarLabel: 'My Receipts',
          tabBarIcon: ({color, size}) => (
            <Image
              source={RECEIPTS_ICON}
              style={{width: size, height: size, tintColor: color}}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Tabs" component={Tabs} options={{headerShown: false}} />
      <Stack.Screen
        name="ReceiptDetail"
        component={ReceiptDetailScreen}
        options={{title: 'Receipt'}}
      />
    </Stack.Navigator>
  );
}
