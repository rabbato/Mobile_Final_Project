import React, { useState, useEffect } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, ActivityIndicator, Divider, Avatar, Icon } from 'react-native-paper';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { useAuth } from '../../contexts/AuthContext';

interface Conversation {
  id: string;
  spotId: string;
  spotName: string;
  userId: string;
  userEmail: string;
  adminId: string;
  adminEmail: string;
  lastMessage: string;
  lastMessageAt: any;
}

const fmtTime = (ts: any) => {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export const ConversationsScreen = ({ navigation }: any) => {
  const { user, userRole } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const field = userRole === 'admin' ? 'adminId' : 'userId';
    const q = query(
      collection(db, 'conversations'),
      where(field, '==', user.uid),
    );
    const unsub = onSnapshot(q, snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() } as Conversation))
        .sort((a, b) => (b.lastMessageAt?.toMillis?.() ?? 0) - (a.lastMessageAt?.toMillis?.() ?? 0));
      setConversations(data);
      setLoading(false);
    });
    return unsub;
  }, [user, userRole]);

  const openChat = (item: Conversation) => {
    navigation.navigate('Chat', {
      conversationId: item.id,
      spotId: item.spotId,
      spotName: item.spotName,
      adminId: item.adminId,
      adminEmail: item.adminEmail,
      userId: item.userId,
      userEmail: item.userEmail,
    });
  };

  if (loading) {
    return <View style={styles.centered}><ActivityIndicator size="large" /></View>;
  }

  if (conversations.length === 0) {
    return (
      <View style={styles.empty}>
        <Icon source="chat-outline" size={68} color="#ccc" />
        <Text variant="bodyLarge" style={styles.emptyTitle}>No conversations yet</Text>
        <Text variant="bodySmall" style={styles.emptyHint}>
          {userRole === 'admin'
            ? 'Conversations will appear here when users message you'
            : "Tap 'Message Owner' on a spot's page to start chatting"}
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      data={conversations}
      keyExtractor={item => item.id}
      ItemSeparatorComponent={() => <Divider />}
      renderItem={({ item }) => {
        const otherEmail = userRole === 'admin' ? item.userEmail : item.adminEmail;
        const initials = (otherEmail ?? '?').charAt(0).toUpperCase();
        return (
          <TouchableOpacity
            style={styles.item}
            onPress={() => openChat(item)}
            activeOpacity={0.7}
          >
            <Avatar.Text size={48} label={initials} style={styles.avatar} />
            <View style={styles.itemBody}>
              <View style={styles.itemTop}>
                <Text style={styles.otherEmail} numberOfLines={1}>{otherEmail}</Text>
                <Text style={styles.timeLabel}>{fmtTime(item.lastMessageAt)}</Text>
              </View>
              <Text style={styles.spotTag} numberOfLines={1}>
                📍 {item.spotName}
              </Text>
              <Text style={styles.lastMsg} numberOfLines={1}>
                {item.lastMessage || '…'}
              </Text>
            </View>
          </TouchableOpacity>
        );
      }}
    />
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { flex: 1, backgroundColor: '#F5F7FA' },
  empty: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    padding: 32, backgroundColor: '#F5F7FA',
  },
  emptyTitle: { marginTop: 16, fontWeight: '600', opacity: 0.6 },
  emptyHint: { marginTop: 8, opacity: 0.4, textAlign: 'center', lineHeight: 20 },
  item: {
    flexDirection: 'row', padding: 16,
    alignItems: 'center', backgroundColor: '#fff',
  },
  avatar: { backgroundColor: '#2A6B9C' },
  itemBody: { flex: 1, marginLeft: 12 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  otherEmail: { fontWeight: '700', fontSize: 14, flex: 1, marginRight: 8, color: '#1A1A2E' },
  timeLabel: { fontSize: 11, opacity: 0.5 },
  spotTag: { fontSize: 11, color: '#2A6B9C', marginTop: 2 },
  lastMsg: { fontSize: 13, opacity: 0.55, marginTop: 3 },
});
