import React from 'react';
import { ActivityIndicator, View, StyleSheet } from 'react-native';

export const LoadingScreen = () => {
    return (
        <View style={styles.container}>
            <ActivityIndicator size={50} color="#8B4BFF" />
        </View>   
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f2f2f2'
    }
});