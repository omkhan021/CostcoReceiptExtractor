import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import HomeScreen from '../screens/HomeScreen';
import SyncScreen from '../screens/SyncScreen';
import ReceiptDetailScreen from '../screens/ReceiptDetailScreen';
import type {AppStackParamList, AppTabParamList} from './types';

const Tab = createBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#005DAA', // Costco blue
        tabBarInactiveTintColor: '#888',
        headerShown: false,
      }}>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{tabBarLabel: 'Search'}}
      />
      <Tab.Screen
        name="Sync"
        component={SyncScreen}
        options={{tabBarLabel: 'Receipts'}}
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
