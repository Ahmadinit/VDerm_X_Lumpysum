// App.tsx
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LaunchScreen from './src/Screens/launchScreen';
import LoginScreen from './src/Screens/loginScreen';
import verifyScreen from './src/Screens/verifyScreen';
import HomeScreen from './src/Screens/homeScreen';
import RegisterScreen from './src/Screens/registerScreen';
import VetsScreen from './src/Screens/vetsScreen';
import DiagnosticScreen from './src/Screens/diagnosticScreen';
import ChatsScreen from './src/Screens/chatsScreen';
import ChatConversationScreen from './src/Screens/chatConversationScreen';
import AppointmentBookingScreen from './src/Screens/appointmentBookingScreen';
import AppointmentChatScreen from './src/Screens/appointmentChatScreen';
import AppointmentsHistoryScreen from './src/Screens/appointmentsHistoryScreen';
import VetDashboardScreen from './src/Screens/vetDashboardScreen';
import VetAppointmentsScreen from './src/Screens/vetAppointmentsScreen';
import VetChatInboxScreen from './src/Screens/vetChatInboxScreen';
import VetDiagnosticReviewScreen from './src/Screens/vetDiagnosticReviewScreen';
import { BASE_URL } from './src/config';

// Define the param list for all screens
export type RootStackParamList = {
  Launch: undefined; 
  Login: undefined; 
  Register: undefined; 
  Verify: undefined; 
  Home: undefined; 
  Vets: undefined; 
  Diagnosis: undefined;
  Chats: undefined;
  ChatConversation: { conversationId: string; title: string };
  AppointmentBooking: { selectedVet?: any };
  AppointmentChat: { appointmentId: string };
  AppointmentsHistory: undefined;
  VetDashboard: undefined;
  VetAppointments: undefined;
  VetChatInbox: undefined;
  VetDiagnosticReview: undefined;
};

// Create a stack navigator
const Stack = createStackNavigator<RootStackParamList>();

const App = () => {
  useEffect(() => {
    // Initialize AsyncStorage with backend URL on app startup
    const initializeApp = async () => {
      try {
        const existingApiUrl = await AsyncStorage.getItem('apiUrl');
        if (!existingApiUrl) {
          // Set default values from config
          await AsyncStorage.setItem('apiUrl', BASE_URL);
          console.log('Initialized apiUrl:', BASE_URL);
        } else {
          console.log('Using existing apiUrl:', existingApiUrl);
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };

    initializeApp();
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Launch">
        <Stack.Screen
          name="Launch"
          component={LaunchScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Verify" component={verifyScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Vets" component={VetsScreen} options={{ headerShown: false }}/>
        <Stack.Screen name='Diagnosis' component={DiagnosticScreen} options={{ headerShown: false }}/>
        <Stack.Screen name="Chats" component={ChatsScreen} options={{ headerShown: false }}/>
        <Stack.Screen 
          name="ChatConversation" 
          component={ChatConversationScreen} 
          options={{ 
            headerShown: true,
            headerStyle: { backgroundColor: '#259D8A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen 
          name="AppointmentBooking"
          component={AppointmentBookingScreen}
          options={{ 
            headerShown: true,
            headerTitle: 'Book Appointment',
            headerStyle: { backgroundColor: '#0066cc' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen 
          name="AppointmentChat"
          component={AppointmentChatScreen}
          options={{ 
            headerShown: true,
            headerTitle: 'Chat with Vet',
            headerStyle: { backgroundColor: '#0066cc' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen 
          name="AppointmentsHistory"
          component={AppointmentsHistoryScreen}
          options={{ 
            headerShown: true,
            headerTitle: 'My Appointments',
            headerStyle: { backgroundColor: '#0066cc' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="VetDashboard"
          component={VetDashboardScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="VetAppointments"
          component={VetAppointmentsScreen}
          options={{
            headerShown: true,
            headerTitle: 'Vet Appointments',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="VetChatInbox"
          component={VetChatInboxScreen}
          options={{
            headerShown: true,
            headerTitle: 'Consultation Inbox',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
        <Stack.Screen
          name="VetDiagnosticReview"
          component={VetDiagnosticReviewScreen}
          options={{
            headerShown: true,
            headerTitle: 'Diagnostic Review',
            headerStyle: { backgroundColor: '#0F172A' },
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: '600' },
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
