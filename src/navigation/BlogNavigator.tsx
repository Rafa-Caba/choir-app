import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlogListScreen } from '../screens/blog/BlogListScreen';
import { BlogDetailScreen } from '../screens/blog/BlogDetailScreen';
import { CreateBlogScreen } from '../screens/blog/CreateBlogScreen';
import { useTheme } from '../context/ThemeContext';

export type BlogStackParamList = {
    BlogList: undefined;
    BlogDetail: undefined;
    CreateBlog: undefined;
};

const Stack = createNativeStackNavigator<BlogStackParamList>();

export const BlogNavigator = () => {
    const { currentTheme } = useTheme();
    const colors = currentTheme;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.backgroundColor,
                },
                headerShadowVisible: false,

                headerTintColor: colors.textColor,
                headerTitleStyle: {
                    color: colors.textColor,
                    fontWeight: 'bold'
                },

                contentStyle: { backgroundColor: colors.backgroundColor }
            }}
        >
            <Stack.Screen
                name="BlogList"
                component={BlogListScreen}
                options={{ headerShown: false }}
            />
            <Stack.Screen
                name="BlogDetail"
                component={BlogDetailScreen}
                options={{ title: 'Detalles' }}
            />
            <Stack.Screen
                name="CreateBlog"
                component={CreateBlogScreen}
                options={{ title: 'Nuevo Post' }}
            />
        </Stack.Navigator>
    );
};