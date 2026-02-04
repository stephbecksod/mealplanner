import { StatusBar } from 'expo-status-bar'
import { ActivityIndicator, View, StyleSheet } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import { AuthProvider, useAuth } from './src/context/AuthContext'
import { MealPlanProvider } from './src/context/MealPlanContext'
import { FavoritesProvider } from './src/context/FavoritesContext'

import LoginScreen from './src/screens/LoginScreen'
import HomeScreen from './src/screens/HomeScreen'
import MealPlanScreen from './src/screens/MealPlanScreen'
import GroceryScreen from './src/screens/GroceryScreen'
import FavoritesScreen from './src/screens/FavoritesScreen'
import ProfileScreen from './src/screens/ProfileScreen'

const Stack = createNativeStackNavigator()
const Tab = createBottomTabNavigator()

const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline'
          } else if (route.name === 'MealPlan') {
            iconName = focused ? 'restaurant' : 'restaurant-outline'
          } else if (route.name === 'Grocery') {
            iconName = focused ? 'cart' : 'cart-outline'
          } else if (route.name === 'Favorites') {
            iconName = focused ? 'heart' : 'heart-outline'
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          paddingBottom: 20,
          paddingTop: 8,
          height: 75,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginBottom: 4,
        },
        headerStyle: {
          backgroundColor: '#16A34A',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Generate' }}
      />
      <Tab.Screen
        name="MealPlan"
        component={MealPlanScreen}
        options={{ title: 'This Week' }}
      />
      <Tab.Screen
        name="Grocery"
        component={GroceryScreen}
        options={{ title: 'Grocery' }}
      />
      <Tab.Screen
        name="Favorites"
        component={FavoritesScreen}
        options={{ title: 'Favorites' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  )
}

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#16A34A" />
      </View>
    )
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MealPlanProvider>
        <FavoritesProvider>
          <NavigationContainer>
            <StatusBar style="light" />
            <AppNavigator />
          </NavigationContainer>
        </FavoritesProvider>
      </MealPlanProvider>
    </AuthProvider>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
})
