import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { BlogListScreen } from '../screens/blog/BlogListScreen';
import { BlogDetailScreen } from '../screens/blog/BlogDetailScreen';
import { CreateBlogScreen } from '../screens/blog/CreateBlogScreen';

export type BlogStackParamList = {
    BlogList: undefined;
    BlogDetail: undefined;
    CreateBlog: undefined;
};

const Stack = createNativeStackNavigator<BlogStackParamList>();

export const BlogNavigator = () => {
    return (
        <Stack.Navigator
            screenOptions={{
                headerTintColor: '#8B4BFF',
                headerTitleStyle: { color: 'black' },
                contentStyle: { backgroundColor: 'white' }
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