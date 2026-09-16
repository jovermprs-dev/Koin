import FontAwesome from "@expo/vector-icons/FontAwesome";
import { Tabs } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";

import { useClientOnlyValue } from "@/components/useClientOnlyValue";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { confirmDestructive } from "@/lib/platformAlert";
import { supabase } from "@/lib/supabase";

function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>["name"];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Resumen",
          tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                confirmDestructive(
                  "Cerrar sesión",
                  "¿Seguro que quieres salir?",
                  "Salir",
                  () => supabase.auth.signOut(),
                )
              }
              style={{ marginRight: 16 }}
            >
              <FontAwesome
                name="sign-out"
                size={20}
                color={Colors[colorScheme ?? "light"].tint}
              />
            </TouchableOpacity>
          ),
        }}
      />
      <Tabs.Screen
        name="transacciones"
        options={{
          title: "Transacciones",
          tabBarIcon: ({ color }) => <TabBarIcon name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="agregar"
        options={{
          title: "Agregar",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="plus-circle" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="presupuestos"
        options={{
          title: "Presupuestos",
          tabBarIcon: ({ color }) => (
            <TabBarIcon name="pie-chart" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
