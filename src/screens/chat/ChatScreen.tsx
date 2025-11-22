import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Text, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../../store/useChatStore';
import { ChatMessageItem } from '../../components/chatMessages/ChatMessageItem';
import { ChatInput } from '../../components/chatMessages/ChatInput';

export const ChatScreen = () => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);

    // Get state from Store
    const { messages, connect, disconnect, sendMessage, loadHistory } = useChatStore();

    // 1. Lifecycle: Connect & Load
    useEffect(() => {
        loadHistory();
        connect();
        
        return () => {
            disconnect();
        };
    }, []);

    // 2. Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (messages.length > 0) {
            // Small timeout ensures list is rendered before scrolling
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 200);
        }
    }, [messages]);

    const handleSend = (text: string, imageUri?: string) => {
        sendMessage(text, imageUri);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            
            {/* Custom Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Chat</Text>
                <Text style={styles.headerSubtitle}>Grupo General</Text>
            </View>

            <KeyboardAvoidingView 
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0} 
            >
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id.toString()}
                    renderItem={({ item }) => <ChatMessageItem message={item} />}
                    contentContainerStyle={styles.listContent}
                    // Initial scroll logic
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyText}>No hay mensajes aún. ¡Saluda!</Text>
                        </View>
                    }
                />
                
                <ChatInput onSend={handleSend} />
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ddc7ff', // Your background color
    },
    header: {
        backgroundColor: '#fff',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: 'rgba(0,0,0,0.6)'
    },
    headerSubtitle: {
        fontSize: 12,
        color: '#8B4BFF',
        fontWeight: '600'
    },
    listContent: {
        paddingVertical: 10,
    },
    emptyContainer: {
        padding: 50,
        alignItems: 'center'
    },
    emptyText: {
        color: '#888',
        fontStyle: 'italic'
    }
});