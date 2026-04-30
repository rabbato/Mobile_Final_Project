import React, { useState, useEffect, useRef } from 'react';
import {
  View, StyleSheet, FlatList, KeyboardAvoidingView, Platform,
} from 'react-native';
import { TextInput, IconButton, Text, ActivityIndicator } from 'react-native-paper';
import {
  collection, query, orderBy, onSnapshot, addDoc,
  serverTimestamp, doc, setDoc,
} from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Message {
  id: string;
  text: string;
  senderId: string;
  senderEmail: string;
  createdAt: any;
}

export const ChatScreen = ({ route }: any) => {
  const {
    conversationId, spotId, spotName,
    adminId, adminEmail, userId, userEmail,
  } = route.params;
  const { user } = useAuth();

  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'asc'),
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Message)));
      setLoading(false);
    });
    return unsub;
  }, [conversationId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const send = async () => {
    const msg = text.trim();
    if (!msg || sending) return;
    setText('');
    setSending(true);
    try {
      await addDoc(collection(db, 'conversations', conversationId, 'messages'), {
        text: msg,
        senderId: user?.uid,
        senderEmail: user?.email,
        createdAt: serverTimestamp(),
      });
      // Create or update conversation document (setDoc with merge)
      await setDoc(doc(db, 'conversations', conversationId), {
        conversationId,
        spotId,
        spotName,
        adminId,
        adminEmail,
        userId,
        userEmail,
        lastMessage: msg,
        lastMessageAt: serverTimestamp(),
      }, { merge: true });
    } finally {
      setSending(false);
    }
  };

  const isMe = (senderId: string) => senderId === user?.uid;

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyText}>No messages yet — say hello!</Text>
          </View>
        }
        renderItem={({ item }) => {
          const mine = isMe(item.senderId);
          return (
            <View style={[styles.bubbleWrap, mine ? styles.bubbleWrapMe : styles.bubbleWrapThem]}>
              {!mine && (
                <Text style={styles.senderLabel}>{item.senderEmail}</Text>
              )}
              <View style={[styles.bubble, mine ? styles.bubbleMe : styles.bubbleThem]}>
                <Text style={[styles.bubbleText, mine ? styles.bubbleTextMe : styles.bubbleTextThem]}>
                  {item.text}
                </Text>
              </View>
              {item.createdAt?.toDate && (
                <Text style={[styles.bubbleTime, mine && { textAlign: 'right' }]}>
                  {item.createdAt.toDate().toLocaleTimeString(undefined, {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              )}
            </View>
          );
        }}
      />

      <View style={styles.inputBar}>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Type a message…"
          mode="outlined"
          style={styles.input}
          multiline
          maxLength={500}
          dense
          outlineStyle={{ borderRadius: 22 }}
        />
        <IconButton
          icon="send"
          size={26}
          iconColor={text.trim() ? '#1A3A5C' : '#bbb'}
          onPress={send}
          disabled={!text.trim() || sending}
          style={styles.sendBtn}
        />
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#EDF2F7' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 12, paddingBottom: 4 },
  emptyChat: { paddingTop: 80, alignItems: 'center' },
  emptyText: { opacity: 0.4, fontSize: 14 },
  bubbleWrap: { marginBottom: 10, maxWidth: '80%' },
  bubbleWrapMe: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  bubbleWrapThem: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  senderLabel: { fontSize: 10, color: '#888', marginBottom: 3, marginLeft: 4 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleMe: {
    backgroundColor: '#1A3A5C',
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMe: { color: '#fff' },
  bubbleTextThem: { color: '#1A1A2E' },
  bubbleTime: { fontSize: 10, opacity: 0.45, marginTop: 3, marginHorizontal: 4 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  input: { flex: 1, backgroundColor: '#fff', maxHeight: 120 },
  sendBtn: { margin: 0, marginLeft: 4 },
});
