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
    const colors = currentTheme.colors;

    return (
        <Stack.Navigator
            screenOptions={{
                headerStyle: {
                    backgroundColor: colors.background, 
                },
                headerShadowVisible: false,

                headerTintColor: colors.text, 
                headerTitleStyle: { 
                    color: colors.text,
                    fontWeight: 'bold'
                },

                contentStyle: { backgroundColor: colors.background }
            }}
        >
            <Stack.Screen 
                name="BlogList" 
                component={BlogListScreen} 
                options={{ headerShown: false }} // Custom header in screen
            />
            <Stack.Screen 
                name="BlogDetail" 
                component={BlogDetailScreen} 
                options={{ title: 'Lectura' }} 
            />
            <Stack.Screen 
                name="CreateBlog" 
                component={CreateBlogScreen} 
                options={{ title: 'Nuevo Post' }} 
            />
        </Stack.Navigator>
    );
};