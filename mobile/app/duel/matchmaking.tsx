import {
  View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator,
  Animated, useRef, useEffect, Platform, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState, useRef as useReactRef, useEffect as useReactEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Image } from 'react-native';
import { Theme } from '../../src/constants/Theme';
import { useAuthStore } from '../../src/store/useAuthStore';
import { duelsService } from '../../src/services/appServices';
import { profileService } from '../../src/services/profileService';
import { tokenStorage } from '../../src/api/axiosClient';
import { io, Socket } from 'socket.io-client';

const API_URL = process.env.EXPO_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:4001';

export default function DuelMatchmaking() {
  const router = useRouter();
  const user = useAuthStore(s => s.user);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const spinAnim = useReactRef(new Animated.Value(0)).current;

  const { data: queueStats, refetch: refetchQueue } = useQuery({
    queryKey: ['duel-queue'],
    queryFn: duelsService.getQueueStats,
    refetchInterval: 10_000,
  });

  const { data: myStats } = useQuery({
    queryKey: ['duel-mystats'],
    queryFn: duelsService.getMyStats,
    retry: false,
  });

  // Spinner animation
  useReactEffect(() => {
    if (isSearching) {
      Animated.loop(
        Animated.timing(spinAnim, { toValue: 1, duration: 1200, useNativeDriver: true })
      ).start();
    } else {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
    }
  }, [isSearching]);

  // Search timer
  useReactEffect(() => {
    if (!isSearching) { setSearchTime(0); return; }
    const timer = setInterval(() => setSearchTime(t => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isSearching]);

  const handleStart = async () => {
    setIsSearching(true);
    try {
      const duel = await duelsService.createOrJoin('easy');
      const token = await tokenStorage.get('accessToken');

      const sock = io(`${API_URL}/duels`, {
        auth: { token: `Bearer ${token}` },
        transports: ['websocket'],
      });

      sock.on('connect', () => {
        sock.emit('join_duel', { duelId: duel.id });
      });

      sock.on('duel_state_update', (state: any) => {
        if (state.status === 'ready' || state.status === 'active') {
          router.push(`/duel/room/${duel.id}`);
        }
      });

      sock.on('connect_error', (err) => {
        if (__DEV__) console.warn('[Socket] connect error:', err.message);
        Alert.alert('Connection Error', 'Could not connect to matchmaking server.');
        setIsSearching(false);
        sock.disconnect();
      });

      setSocket(sock);
    } catch (err: any) {
      if (__DEV__) console.error('[Matchmaking]', err?.response?.data ?? err.message);
      Alert.alert('Error', 'Failed to start matchmaking. Please try again.');
      setIsSearching(false);
    }
  };

  const handleCancel = () => {
    setIsSearching(false);
    socket?.disconnect();
    setSocket(null);
  };

  // Cleanup on unmount
  useReactEffect(() => () => { socket?.disconnect(); }, [socket]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const elo = myStats?.elo ?? user?.elo ?? 1200;
  const avatarUrl = profileService.getAvatarUrl(user?.profileImage, user?.username);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Text style={styles.iconEmoji}>⚔️</Text>
          </View>
          <Text style={styles.title}>DUEL 1v1</Text>
          <Text style={styles.subtitle}>Challenge an opponent of similar level in real-time</Text>
        </View>

        {/* Main card */}
        <View style={styles.card}>
          {!isSearching ? (
            <>
              {/* Player info */}
              <View style={styles.playerCenter}>
                <Image source={{ uri: avatarUrl }} style={styles.playerAvatar} />
                <Text style={styles.playerName}>{user?.username}</Text>
                <Text style={styles.playerElo}>ELO: <Text style={styles.eloVal}>{elo}</Text></Text>
                {myStats && (
                  <View style={styles.statsRow}>
                    <Text style={[styles.statChip, { color: Theme.colors.stateSuccess }]}>
                      {myStats.duelsWon}W
                    </Text>
                    <Text style={[styles.statChip, { color: Theme.colors.stateError }]}>
                      {myStats.duelsLost}L
                    </Text>
                    <Text style={[styles.statChip, { color: Theme.colors.textMuted }]}>
                      {myStats.winRate}%
                    </Text>
                    {myStats.streak > 0 && (
                      <Text style={[styles.statChip, { color: '#fb923c' }]}>
                        🔥 {myStats.streak}{myStats.streakType}
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {/* Queue stats */}
              <View style={styles.infoGrid}>
                {[
                  { label: 'ELO Range', val: `${elo - 100}–${elo + 100}` },
                  { label: 'Online', val: queueStats?.playersOnline ?? '...' },
                  { label: 'Active Duels', val: queueStats?.activeDuels ?? '...' },
                  { label: 'Wait', val: queueStats ? `~${queueStats.estimatedWaitSeconds}s` : '...' },
                ].map(item => (
                  <View key={item.label} style={styles.infoBox}>
                    <Text style={styles.infoVal}>{item.val}</Text>
                    <Text style={styles.infoLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>

              {/* Start button */}
              <Pressable style={styles.startBtn} onPress={handleStart}>
                <Text style={styles.startBtnText}>⚔  START SEARCH</Text>
              </Pressable>
            </>
          ) : (
            /* Searching animation */
            <View style={styles.searchingBox}>
              <View style={styles.radarContainer}>
                <View style={styles.radarRing} />
                <Animated.View style={[styles.radarSpinner, { transform: [{ rotate: spin }] }]}>
                  <View style={styles.radarSpinnerLine} />
                </Animated.View>
                <Text style={styles.radarIcon}>⚔️</Text>
              </View>
              <Text style={styles.searchingTitle}>SEARCHING FOR OPPONENT...</Text>
              <Text style={styles.searchingTimer}>Time elapsed: {searchTime}s</Text>
              <View style={styles.eloRange}>
                <Text style={styles.eloRangeText}>
                  Looking for ELO {elo - 100} – {elo + 100}
                </Text>
              </View>
              <Pressable style={styles.cancelBtn} onPress={handleCancel}>
                <Text style={styles.cancelBtnText}>CANCEL</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>DUEL RULES</Text>
          {[
            '⚡ First to solve the problem wins',
            '⏱ Wrong submission adds a time penalty',
            '👁 You can see opponent\'s progress (not their code)',
            '📈 Winning increases your ELO, losing decreases it',
          ].map((tip, i) => (
            <Text key={i} style={styles.tipText}>{tip}</Text>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  iconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: `${Theme.colors.brandPrimary}33`,
    borderWidth: 2, borderColor: Theme.colors.brandPrimary, justifyContent: 'center', alignItems: 'center', marginBottom: 14 },
  iconEmoji: { fontSize: 36 },
  title: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 28, letterSpacing: 4,
    textShadowColor: 'rgba(0,229,255,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 12 },
  subtitle: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 6 },
  card: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 20, marginBottom: 16 },
  playerCenter: { alignItems: 'center', paddingBottom: 20, marginBottom: 20,
    borderBottomWidth: 1, borderBottomColor: Theme.colors.borderDefault },
  playerAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: Theme.colors.brandPrimary, marginBottom: 12 },
  playerName: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 20 },
  playerElo: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 14, marginTop: 4 },
  eloVal: { color: Theme.colors.brandPrimary, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  statChip: { fontFamily: Theme.fonts.title, fontSize: 15 },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  infoBox: { flex: 1, minWidth: '45%', backgroundColor: Theme.colors.surface2, borderRadius: 10, padding: 12, alignItems: 'center' },
  infoVal: { fontFamily: Theme.fonts.title, color: Theme.colors.textPrimary, fontSize: 16 },
  infoLabel: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 11, marginTop: 4, letterSpacing: 1 },
  startBtn: { backgroundColor: Theme.colors.brandPrimary, borderRadius: Theme.layout.borderRadius,
    padding: 18, alignItems: 'center', shadowColor: Theme.colors.brandPrimary, shadowOpacity: 0.6, shadowRadius: 16, elevation: 10 },
  startBtnText: { fontFamily: Theme.fonts.title, color: '#0b1020', fontSize: 18, letterSpacing: 4 },
  searchingBox: { alignItems: 'center', paddingVertical: 20 },
  radarContainer: { width: 120, height: 120, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  radarRing: { position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderWidth: 3, borderColor: `${Theme.colors.brandPrimary}44` },
  radarSpinner: { position: 'absolute', width: 120, height: 120, borderRadius: 60,
    borderTopWidth: 3, borderTopColor: Theme.colors.brandPrimary,
    borderRightWidth: 3, borderRightColor: 'transparent',
    borderBottomWidth: 3, borderBottomColor: 'transparent',
    borderLeftWidth: 3, borderLeftColor: 'transparent' },
  radarSpinnerLine: { position: 'absolute' },
  radarIcon: { fontSize: 40 },
  searchingTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandPrimary, fontSize: 16, letterSpacing: 2, textAlign: 'center' },
  searchingTimer: { fontFamily: Theme.fonts.ui, color: Theme.colors.textMuted, fontSize: 14, marginTop: 8, marginBottom: 16 },
  eloRange: { backgroundColor: Theme.colors.surface2, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginBottom: 24 },
  eloRangeText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14 },
  cancelBtn: { borderWidth: 2, borderColor: Theme.colors.stateError, borderRadius: Theme.layout.borderRadius,
    paddingVertical: 12, paddingHorizontal: 32 },
  cancelBtnText: { fontFamily: Theme.fonts.title, color: Theme.colors.stateError, letterSpacing: 2, fontSize: 14 },
  tipsCard: { backgroundColor: Theme.colors.surface1, borderRadius: Theme.layout.cardRadius,
    borderWidth: 1, borderColor: Theme.colors.borderDefault, padding: 16 },
  tipsTitle: { fontFamily: Theme.fonts.title, color: Theme.colors.brandSecondary, fontSize: 13, letterSpacing: 2, marginBottom: 14 },
  tipText: { fontFamily: Theme.fonts.ui, color: Theme.colors.textSecondary, fontSize: 14, marginBottom: 10, lineHeight: 20 },
});
