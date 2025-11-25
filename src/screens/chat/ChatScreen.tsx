import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, FlatList, KeyboardAvoidingView, Platform, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatStore } from '../../store/useChatStore';
import { ChatMessageItem } from '../../components/chatMessages/ChatMessageItem';
import { ChatInput } from '../../components/chatMessages/ChatInput';
import { useTheme } from '../../context/ThemeContext'; // 1. Import Theme

export const ChatScreen = () => {
    const insets = useSafeAreaInsets();
    const flatListRef = useRef<FlatList>(null);
    const { messages, connect, disconnect, sendMessage, loadHistory } = useChatStore();
    
    // 2. Get Theme
    const { currentTheme } = useTheme();
    const colors = currentTheme.colors;

    useEffect(() => {
        loadHistory();
        connect();
        return () => disconnect();
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => {
                flatListRef.current?.scrollToEnd({ animated: true });
            }, 200);
        }
    }, [messages]);

    const handleSend = (text: string, imageUri?: string, audioUri?: string) => {
        sendMessage(text, imageUri, audioUri);
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
            
            {/* Custom Header with Dynamic Colors */}
            <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Chat</Text>
                <Text style={[styles.headerSubtitle, { color: colors.primary }]}>Grupo General</Text>
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
                    onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                                No hay mensajes aún. ¡Saluda!
                            </Text>
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
        // backgroundColor handled inline
    },
    header: {
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        elevation: 3,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowOffset: { width: 0, height: 2 }
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    headerSubtitle: {
        fontSize: 12,
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
        fontStyle: 'italic'
    }
});