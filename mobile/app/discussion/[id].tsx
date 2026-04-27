import {
  View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Alert, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Theme } from '../../src/constants/Theme';
import { discussionsService } from '../../src/services/appServices';
import { useAuthStore } from '../../src/store/useAuthStore';
import { profileService } from '../../src/services/profileService';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

export default function DiscussionDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const user = useAuthStore(s => s.user);
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { data: d, isLoading, error } = useQuery({
    queryKey: ['discussion', id],
    queryFn: () => discussionsService.getById(id),
    enabled: !!id,
  });

  const handleUpvote = async () => {
    try {
      await discussionsService.upvote(id);
      qc.invalidateQueries({ queryKey: ['discussion', id] });
    } catch { Alert.alert('Error', 'Could not upvote.'); }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      await discussionsService.createComment(id, comment.trim());
      setComment('');
      qc.invalidateQueries({ queryKey: ['discussion', id] });
    } catch { Alert.alert('Error', 'Could not post comment.'); }
    finally { setSubmitting(false); }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Theme.colors.brandPrimary} />
      </View>
    );
  }

  if (error || !d) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Failed to load discussion.</Text>
      </View>
    );
  }

  const comments = d.comments ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Post header */}
        <View style={styles.post}>
          <Text style={styles.postTitle}>{d.title}</Text>

          <View style={styles.authorRow}>
            <Image
              source={{ uri: profileService.getAvatarUrl(d.author?.profileImage, d.author?.username) }}
              style={styles.authorAvatar}
            />
            <View>
              <Text style={styles.authorName}>{d.author?.username ?? 'Anonymous'}</Text>
              <Text style={styles.postTime}>{timeAgo(d.createdAt)}</Text>
            </View>
            <Pressable style={styles.upvoteBtn} onPress={handleUpvote}>
              <Text style={styles.upvoteText}>⬆ {d.upvotes ?? d._count?.upvotes ?? 0}</Text>
            </Pressable>
          </View>

          {d.tags?.length > 0 && (
            <View style={styles.tags}>
              {d.tags.map((t: string) => (
                <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
              ))}
            </View>
          )}

          <Text style={styles.postBody}>{d.content}</Text>
        </View>

        {/* Comments */}
        <Text style={styles.sectionTitle}>💬 {comments.length} Comments</Text>

        {comments.map((c: any) => (
          <View key={c.id} style={styles.commentCard}>
            <View style={styles.commentHeader}>
              <Image
                source={{ uri: profileService.getAvatarUrl(c.author?.profileImage, c.author?.username) }}
                style={styles.commentAvatar}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.commentAuthor}>{c.author?.username ?? 'Anonymous'}</Text>
                <Text style={styles.commentTime}>{timeAgo(c.createdAt)}</Text>
              </View>
              <Text style={styles.commentLikes}>⬆ {c.upvotes ?? 0}</Text>
            </View>
            <Text style={styles.commentBody}>{c.content}</Text>
          </View>
        ))}

        {comments.length === 0 && (
          <Text style={styles.emptyComments}>No comments yet. Be the first to reply!</Text>
        )}

        {/* Add comment */}
        <View style={styles.addComment}>
          <Text style={styles.sectionTitle}>ADD A COMMENT</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Write your reply..."
            placeholderTextColor={Theme.colors.textMuted}
            multiline
            value={comment}
            onChangeText={setComment}
          />
          <Pressable style={[styles.submitBtn, submitting && styles.disabledBtn]} onPress={handleComment} disabled={submitting}>
            {submitting
              ? <ActivityIndicator color="#0b1020" />
              : <Text style={styles.submitText}>POST COMMENT</Text>
            }
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Theme.colors.background },
  content: { padding: 16, paddingBottom: 60 },
  post: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginBottom: 20 },
  postTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 22, marginBottom: 14, lineHeight: 30 },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  authorAvatar: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: Theme.colors.borderDefault },
  authorName: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 14, fontWeight: 'bold' },
  postTime: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 12 },
  upvoteBtn: { marginLeft: 'auto', backgroundColor: `${Theme.colors.brandPrimary}22`,
    borderWidth: 1, borderColor: Theme.colors.brandPrimary, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  upvoteText: { fontFamily: Theme.fonts.ui, color: Theme.colors.brandPrimary, fontSize: 14, fontWeight: 'bold' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  tag: { backgroundColor: Theme.colors.surface2, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Theme.colors.borderDefault },
  tagText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11 },
  postBody: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 15, lineHeight: 24 },
  sectionTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 14,
    letterSpacing: 1, marginBottom: 12 },
  commentCard: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 14, marginBottom: 10 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  commentAvatar: { width: 30, height: 30, borderRadius: 15 },
  commentAuthor: { fontFamily: Theme.fonts.ui, color: Theme.colors.textPrimary, fontSize: 13, fontWeight: 'bold' },
  commentTime: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11 },
  commentLikes: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 13 },
  commentBody: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14, lineHeight: 22 },
  emptyComments: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, textAlign: 'center', padding: 20, fontStyle: 'italic' },
  addComment: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16, marginTop: 8 },
  commentInput: { backgroundColor: Theme.colors.surface2, borderWidth: 1, borderColor: Theme.colors.borderDefault,
    borderRadius: Theme.layout.borderRadius, color: Theme.colors.textPrimary, fontFamily: Theme.fonts.ui,
    padding: 12, fontSize: 15, minHeight: 100, textAlignVertical: 'top', marginBottom: 12 },
  submitBtn: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius,
    padding: 14, alignItems: 'center' },
  disabledBtn: { opacity: 0.6 },
  submitText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 15, letterSpacing: 2 },
  errorText: { fontFamily: Theme.fonts.ui, color: Theme.colors.stateError, fontSize: 16 },
});
