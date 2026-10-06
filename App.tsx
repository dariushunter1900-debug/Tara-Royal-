import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View
} from "react-native";
import { StatusBar } from "expo-status-bar";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { supabase } from "./src/lib/supabase";

type Tab = "Home" | "Rewards" | "Rank" | "Profile";

const GOLD = "#F7C948";
const GOLD2 = "#FFE7A1";
const BG = "#07090F";
const CARD = "#11141D";
const MUTED = "#8F95A6";

const achievements = [
  { id: "first_tap", title: "First Royal Tap", icon: "✦", target: 1 },
  { id: "hundred", title: "Century Club", icon: "💎", target: 100 },
  { id: "five_hundred", title: "Royal Grinder", icon: "👑", target: 500 },
  { id: "thousand", title: "Tara Legend", icon: "🏆", target: 1000 }
];

export default function App() {
  const [tab, setTab] = useState<Tab>("Home");
  const [coins, setCoins] = useState(2480);
  const [taps, setTaps] = useState(0);
  const [streak, setStreak] = useState(3);
  const [claimed, setClaimed] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referral, setReferral] = useState("");
  const [sessionEmail, setSessionEmail] = useState<string | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSessionEmail(data.session?.user.email ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSessionEmail(session?.user.email ?? null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const progress = Math.min(taps / 1000, 1);
  const earnedToday = taps * 2;

  const tap = async () => {
    setTaps((v) => v + 1);
    setCoins((v) => v + 2);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.92, duration: 50, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true })
    ]).start();

    if (supabase && sessionEmail) {
      await supabase.rpc("add_tap", { p_amount: 2 });
    }
  };

  const claimDaily = async () => {
    if (claimed) return;
    const reward = 100 + streak * 25;
    setCoins((v) => v + reward);
    setClaimed(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (supabase && sessionEmail) {
      const { error } = await supabase.rpc("claim_daily_reward");
      if (error) console.log(error.message);
    }
  };

  const auth = async (mode: "login" | "signup") => {
    if (!supabase) {
      Alert.alert("Supabase not configured", "Copy .env.example to .env and add your Supabase URL and anon key.");
      return;
    }
    setAuthBusy(true);
    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    setAuthBusy(false);
    if (result.error) Alert.alert("Account", result.error.message);
    else Alert.alert("Success", mode === "signup" ? "Check your email if confirmation is enabled." : "Welcome back to Tara Royal.");
  };

  const signOut = async () => {
    await supabase?.auth.signOut();
    setSessionEmail(null);
  };

  const topTitle = useMemo(() => {
    if (tab === "Rewards") return "Royal Rewards";
    if (tab === "Rank") return "Royal Rankings";
    if (tab === "Profile") return "My Royal Profile";
    return "Tara Royal";
  }, [tab]);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Pressable style={styles.iconButton} onPress={() => Alert.alert("Tara Royal", "Your royal menu is ready for future settings.")}>
          <Text style={styles.menu}>☰</Text>
        </Pressable>
        <View style={styles.brand}>
          <Text style={styles.crown}>♛</Text>
          <Text style={styles.logo}>TARA ROYAL</Text>
          <Text style={styles.tagline}>EARN • PLAY • REIGN</Text>
        </View>
        <Pressable style={styles.iconButton} onPress={() => setTab("Profile")}>
          <Text style={styles.profileIcon}>◉</Text>
        </Pressable>
      </View>

      <View style={styles.balanceBar}>
        <View style={styles.coinBadge}><Text style={styles.coin}>✦</Text></View>
        <View>
          <Text style={styles.balanceLabel}>ROYAL COINS</Text>
          <Text style={styles.balance}>{coins.toLocaleString()}</Text>
        </View>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.smallButton} onPress={() => setTab("Rewards")}>
          <Text style={styles.smallButtonText}>Rewards</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>{topTitle}</Text>

        {tab === "Home" && (
          <>
            <LinearGradient colors={["#221A08", "#0E1017"]} style={styles.hero}>
              <View style={{ flex: 1 }}>
                <Text style={styles.heroKicker}>WELCOME TO</Text>
                <Text style={styles.heroTitle}>TARA ROYAL</Text>
                <Text style={styles.heroCopy}>Tap. Earn Coins. Build your streak. Unlock your crown.</Text>
                <Pressable style={styles.heroButton} onPress={() => setTab("Rewards")}>
                  <Text style={styles.heroButtonText}>CLAIM TODAY'S REWARDS</Text>
                </Pressable>
              </View>
              <View style={styles.heroCrown}><Text style={{fontSize: 66}}>♛</Text></View>
            </LinearGradient>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Royal Tap</Text>
              <Text style={styles.sectionLink}>+2 coins / tap</Text>
            </View>

            <View style={styles.tapCard}>
              <Animated.View style={{ transform: [{ scale }] }}>
                <Pressable onPress={tap} style={styles.tapButton}>
                  <LinearGradient colors={["#FFE69A", "#E8A91C", "#8E5C06"]} style={styles.tapGradient}>
                    <Text style={styles.tapCrown}>♛</Text>
                    <Text style={styles.tapText}>TAP</Text>
                    <Text style={styles.tapSub}>+2 COINS</Text>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
              <Text style={styles.tapStats}>{taps.toLocaleString()} taps today  •  +{earnedToday.toLocaleString()} coins earned</Text>
              <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
            </View>

            <View style={styles.grid}>
              <Stat title="🔥 Streak" value={`${streak} days`} />
              <Stat title="🏆 Level" value={taps >= 1000 ? "Legend" : taps >= 500 ? "Royal" : "Rising"} />
              <Stat title="✦ Today" value={`+${earnedToday}`} />
              <Stat title="♛ Rank" value="#27" />
            </View>

            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>Daily Royal Bonus</Text>
              <Text style={styles.sectionLink}>{claimed ? "Claimed ✓" : "Ready"}</Text>
            </View>
            <Pressable onPress={claimDaily} style={styles.dailyCard}>
              <View style={styles.dailyIcon}><Text style={{fontSize: 28}}>🎁</Text></View>
              <View style={{flex: 1}}>
                <Text style={styles.dailyTitle}>{claimed ? "Come back tomorrow" : `Day ${streak + 1} Royal Reward`}</Text>
                <Text style={styles.dailyCopy}>{claimed ? "Your streak is protected for today." : `Claim +${100 + streak * 25} Coins and keep your streak alive.`}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          </>
        )}

        {tab === "Rewards" && (
          <>
            <View style={styles.rewardHero}>
              <Text style={styles.rewardKicker}>YOUR ROYAL STREAK</Text>
              <Text style={styles.rewardBig}>{streak} DAYS</Text>
              <Text style={styles.rewardCopy}>Keep showing up to unlock bigger daily bonuses.</Text>
              <View style={styles.streakRow}>{[1,2,3,4,5,6,7].map((d) => <View key={d} style={[styles.dayDot, d <= streak && styles.dayDotActive]}><Text style={styles.dayText}>{d}</Text></View>)}</View>
            </View>
            <Reward title="Daily Royal Chest" copy={`+${100 + streak * 25} Coins`} icon="🎁" action={claimed ? "CLAIMED" : "CLAIM"} onPress={claimDaily} disabled={claimed} />
            <Reward title="Refer a Friend" copy="Both royals receive +250 Coins" icon="🤝" action="SHARE CODE" onPress={() => Alert.alert("Your referral code", "TARA-ROYAL-27")} />
            <Reward title="Achievement Vault" copy={`${achievements.filter(a => taps >= a.target).length}/${achievements.length} unlocked`} icon="🏆" action="VIEW" onPress={() => Alert.alert("Achievements", achievements.map(a => `${taps >= a.target ? "✓" : "○"} ${a.title}`).join("\n"))} />
          </>
        )}

        {tab === "Rank" && (
          <>
            <View style={styles.rankHero}>
              <Text style={styles.rankCrown}>♛</Text>
              <Text style={styles.rankNumber}>#27</Text>
              <Text style={styles.rankCopy}>You're rising through the Tara Royal court.</Text>
            </View>
            {["QueenNova", "RoyalMaya", "CrownKai", "TaraStar", "GoldenAce"].map((name, i) => (
              <View style={styles.rankRow} key={name}>
                <Text style={styles.rankPos}>{i + 1}</Text>
                <View style={styles.avatar}><Text>{["👑","💎","⭐","🌟","🦁"][i]}</Text></View>
                <Text style={styles.rankName}>{name}</Text>
                <Text style={styles.rankCoins}>{(9820 - i * 730).toLocaleString()} ✦</Text>
              </View>
            ))}
          </>
        )}

        {tab === "Profile" && (
          <>
            {sessionEmail ? (
              <View style={styles.profileCard}>
                <View style={styles.avatarLarge}><Text style={{fontSize: 36}}>👑</Text></View>
                <Text style={styles.profileName}>Royal Member</Text>
                <Text style={styles.profileEmail}>{sessionEmail}</Text>
                <View style={styles.profileStats}><Stat title="Coins" value={coins.toLocaleString()} /><Stat title="Taps" value={taps.toLocaleString()} /></View>
                <Pressable style={styles.outlineButton} onPress={signOut}><Text style={styles.outlineText}>SIGN OUT</Text></Pressable>
              </View>
            ) : (
              <View style={styles.authCard}>
                <Text style={styles.authTitle}>Enter the Royal Court</Text>
                <Text style={styles.authCopy}>Create an account to save Coins, streaks, referrals and achievements in the cloud.</Text>
                <TextInput placeholder="Email" placeholderTextColor="#6F7482" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" style={styles.input} />
                <TextInput placeholder="Password" placeholderTextColor="#6F7482" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
                <Pressable disabled={authBusy} style={styles.authButton} onPress={() => auth("signup")}><Text style={styles.authButtonText}>{authBusy ? "PLEASE WAIT..." : "CREATE ROYAL ACCOUNT"}</Text></Pressable>
                <Pressable style={styles.textButton} onPress={() => auth("login")}><Text style={styles.textButtonText}>Already a member? Sign in</Text></Pressable>
                <TextInput placeholder="Referral code (optional)" placeholderTextColor="#6F7482" value={referral} onChangeText={setReferral} autoCapitalize="characters" style={styles.input} />
              </View>
            )}
          </>
        )}

        {tab === "Home" && (
          <View style={styles.achievementCard}>
            <View style={styles.sectionRow}><Text style={styles.sectionTitle}>Achievements</Text><Text style={styles.sectionLink}>{achievements.filter(a => taps >= a.target).length}/{achievements.length}</Text></View>
            {achievements.slice(0, 3).map(a => (
              <View style={styles.achievementRow} key={a.id}>
                <View style={[styles.achievementIcon, taps >= a.target && styles.achievementUnlocked]}><Text>{a.icon}</Text></View>
                <View style={{flex:1}}><Text style={styles.achievementTitle}>{a.title}</Text><Text style={styles.achievementCopy}>{taps >= a.target ? "Unlocked" : `Reach ${a.target.toLocaleString()} taps`}</Text></View>
                <Text style={styles.achievementCheck}>{taps >= a.target ? "✓" : "›"}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.bottomNav}>
        {(["Home","Rewards","Rank","Profile"] as Tab[]).map((item) => (
          <Pressable key={item} style={styles.navItem} onPress={() => setTab(item)}>
            <Text style={[styles.navIcon, tab === item && styles.navActive]}>{item === "Home" ? "⌂" : item === "Rewards" ? "🎁" : item === "Rank" ? "🏆" : "◉"}</Text>
            <Text style={[styles.navLabel, tab === item && styles.navActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return <View style={styles.stat}><Text style={styles.statTitle}>{title}</Text><Text style={styles.statValue}>{value}</Text></View>;
}

function Reward({ title, copy, icon, action, onPress, disabled }: any) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.rewardCard, disabled && {opacity: 0.55}]}>
    <View style={styles.rewardIcon}><Text style={{fontSize: 25}}>{icon}</Text></View>
    <View style={{flex:1}}><Text style={styles.rewardTitle}>{title}</Text><Text style={styles.rewardCopy}>{copy}</Text></View>
    <Text style={styles.rewardAction}>{action}</Text>
  </Pressable>;
}

const styles = StyleSheet.create({
  root:{flex:1,backgroundColor:BG},
  header:{height:94,paddingTop:28,paddingHorizontal:18,flexDirection:"row",alignItems:"center",borderBottomWidth:1,borderBottomColor:"#20232D"},
  iconButton:{width:42,height:42,alignItems:"center",justifyContent:"center"},
  menu:{fontSize:27,color:GOLD},
  profileIcon:{fontSize:27,color:GOLD},
  brand:{alignItems:"center",flex:1},
  crown:{fontSize:28,color:GOLD,lineHeight:30},
  logo:{fontSize:21,fontWeight:"900",letterSpacing:1.5,color:GOLD2},
  tagline:{fontSize:8,letterSpacing:3,color:GOLD,marginTop:1},
  balanceBar:{margin:14,padding:12,borderRadius:18,borderWidth:1,borderColor:"#3C3420",backgroundColor:"#10131A",flexDirection:"row",alignItems:"center"},
  coinBadge:{width:40,height:40,borderRadius:20,backgroundColor:"#E4A91E",alignItems:"center",justifyContent:"center",marginRight:10},
  coin:{fontSize:23,color:"#16100A"},
  balanceLabel:{fontSize:9,color:MUTED,letterSpacing:1.3},
  balance:{fontSize:20,fontWeight:"800",color:"#FFF"},
  smallButton:{paddingHorizontal:15,paddingVertical:9,borderRadius:12,backgroundColor:GOLD},
  smallButtonText:{fontWeight:"800",color:"#17120A",fontSize:12},
  scroll:{paddingHorizontal:16,paddingBottom:110},
  pageTitle:{fontSize:25,fontWeight:"900",color:"#FFF",marginBottom:13},
  hero:{borderRadius:24,padding:20,minHeight:185,borderWidth:1,borderColor:"#76530E",flexDirection:"row",overflow:"hidden"},
  heroKicker:{fontSize:11,color:GOLD,letterSpacing:2,fontWeight:"800"},
  heroTitle:{fontSize:31,fontWeight:"900",color:"#FFF",marginTop:5},
  heroCopy:{fontSize:12,color:"#B8BCC7",lineHeight:18,maxWidth:230,marginTop:7},
  heroButton:{backgroundColor:GOLD,paddingVertical:11,paddingHorizontal:13,borderRadius:11,alignSelf:"flex-start",marginTop:13},
  heroButtonText:{fontSize:10,fontWeight:"900",color:"#15110A"},
  heroCrown:{width:105,alignItems:"center",justifyContent:"center",opacity:0.9},
  sectionRow:{flexDirection:"row",alignItems:"center",justifyContent:"space-between",marginTop:21,marginBottom:10},
  sectionTitle:{fontSize:18,fontWeight:"900",color:"#FFF"},
  sectionLink:{fontSize:11,color:GOLD},
  tapCard:{backgroundColor:CARD,borderRadius:22,padding:17,borderWidth:1,borderColor:"#252A35",alignItems:"center"},
  tapButton:{width:154,height:154,borderRadius:77,overflow:"hidden",elevation:12},
  tapGradient:{flex:1,alignItems:"center",justifyContent:"center",borderRadius:77,borderWidth:2,borderColor:"#FFE6A0"},
  tapCrown:{fontSize:43,color:"#16100A"},
  tapText:{fontSize:26,fontWeight:"900",color:"#16100A",letterSpacing:2},
  tapSub:{fontSize:10,fontWeight:"900",color:"#2B1C05",marginTop:1},
  tapStats:{fontSize:11,color:"#B2B7C2",marginTop:13},
  progressTrack:{height:6,backgroundColor:"#292D38",borderRadius:3,width:"100%",marginTop:11,overflow:"hidden"},
  progressFill:{height:"100%",backgroundColor:GOLD,borderRadius:3},
  grid:{flexDirection:"row",flexWrap:"wrap",gap:9,marginTop:10},
  stat:{backgroundColor:CARD,borderRadius:16,borderWidth:1,borderColor:"#252A35",padding:13,flex:1,minWidth:"46%"},
  statTitle:{fontSize:10,color:MUTED,marginBottom:4},
  statValue:{fontSize:17,fontWeight:"900",color:"#FFF"},
  dailyCard:{backgroundColor:"#15130F",borderRadius:19,borderWidth:1,borderColor:"#554319",padding:14,flexDirection:"row",alignItems:"center"},
  dailyIcon:{width:48,height:48,borderRadius:14,backgroundColor:"#29200D",alignItems:"center",justifyContent:"center",marginRight:12},
  dailyTitle:{fontSize:14,fontWeight:"800",color:"#FFF"},
  dailyCopy:{fontSize:11,color:MUTED,marginTop:4,lineHeight:16},
  chevron:{fontSize:28,color:GOLD,paddingLeft:8},
  achievementCard:{marginTop:20,backgroundColor:CARD,borderRadius:20,padding:15,borderWidth:1,borderColor:"#252A35"},
  achievementRow:{flexDirection:"row",alignItems:"center",paddingVertical:9},
  achievementIcon:{width:42,height:42,borderRadius:13,backgroundColor:"#1B1E27",alignItems:"center",justifyContent:"center",marginRight:11},
  achievementUnlocked:{backgroundColor:"#2B220E",borderWidth:1,borderColor:"#705315"},
  achievementTitle:{fontSize:13,fontWeight:"800",color:"#FFF"},
  achievementCopy:{fontSize:10,color:MUTED,marginTop:2},
  achievementCheck:{fontSize:20,color:GOLD},
  rewardHero:{backgroundColor:"#17130B",borderRadius:22,padding:20,borderWidth:1,borderColor:"#584515",alignItems:"center"},
  rewardKicker:{fontSize:10,color:GOLD,letterSpacing:2,fontWeight:"800"},
  rewardBig:{fontSize:40,fontWeight:"900",color:"#FFF",marginVertical:4},
  rewardCopy:{fontSize:12,color:MUTED,textAlign:"center"},
  streakRow:{flexDirection:"row",gap:7,marginTop:18},
  dayDot:{width:32,height:32,borderRadius:16,backgroundColor:"#282C36",alignItems:"center",justifyContent:"center"},
  dayDotActive:{backgroundColor:GOLD},
  dayText:{fontSize:11,fontWeight:"900",color:"#111"},
  rewardCard:{backgroundColor:CARD,borderRadius:18,borderWidth:1,borderColor:"#252A35",padding:14,flexDirection:"row",alignItems:"center",marginTop:11},
  rewardIcon:{width:48,height:48,borderRadius:15,backgroundColor:"#1B1E27",alignItems:"center",justifyContent:"center",marginRight:12},
  rewardTitle:{fontSize:14,fontWeight:"800",color:"#FFF"},
  rewardCopy:{fontSize:11,color:MUTED,marginTop:4},
  rewardAction:{fontSize:10,fontWeight:"900",color:GOLD},
  rankHero:{backgroundColor:"#17130B",borderRadius:22,padding:20,alignItems:"center",borderWidth:1,borderColor:"#584515",marginBottom:10},
  rankCrown:{fontSize:46,color:GOLD},
  rankNumber:{fontSize:32,fontWeight:"900",color:"#FFF"},
  rankCopy:{fontSize:12,color:MUTED,marginTop:4},
  rankRow:{height:64,backgroundColor:CARD,borderRadius:16,borderWidth:1,borderColor:"#252A35",marginBottom:8,flexDirection:"row",alignItems:"center",paddingHorizontal:13},
  rankPos:{width:25,color:GOLD,fontWeight:"900"},
  avatar:{width:38,height:38,borderRadius:19,backgroundColor:"#242833",alignItems:"center",justifyContent:"center",marginRight:10},
  rankName:{flex:1,color:"#FFF",fontWeight:"800"},
  rankCoins:{color:GOLD,fontWeight:"800",fontSize:11},
  profileCard:{backgroundColor:CARD,borderRadius:22,padding:22,alignItems:"center",borderWidth:1,borderColor:"#252A35"},
  avatarLarge:{width:80,height:80,borderRadius:40,backgroundColor:"#2A210D",borderWidth:1,borderColor:GOLD,alignItems:"center",justifyContent:"center"},
  profileName:{fontSize:22,fontWeight:"900",color:"#FFF",marginTop:12},
  profileEmail:{fontSize:11,color:MUTED,marginTop:4},
  profileStats:{flexDirection:"row",gap:10,width:"100%",marginTop:18},
  outlineButton:{marginTop:18,borderWidth:1,borderColor:"#5D6575",paddingVertical:12,paddingHorizontal:25,borderRadius:12},
  outlineText:{color:"#FFF",fontWeight:"800",fontSize:11},
  authCard:{backgroundColor:CARD,borderRadius:22,padding:20,borderWidth:1,borderColor:"#252A35"},
  authTitle:{fontSize:24,fontWeight:"900",color:"#FFF"},
  authCopy:{fontSize:12,color:MUTED,lineHeight:18,marginTop:6,marginBottom:14},
  input:{backgroundColor:"#0B0E14",borderRadius:13,borderWidth:1,borderColor:"#2A2F3A",height:50,paddingHorizontal:14,color:"#FFF",marginBottom:10},
  authButton:{backgroundColor:GOLD,borderRadius:13,height:50,alignItems:"center",justifyContent:"center"},
  authButtonText:{fontSize:11,fontWeight:"900",color:"#15110A"},
  textButton:{alignItems:"center",paddingVertical:13},
  textButtonText:{color:GOLD,fontSize:11,fontWeight:"700"},
  bottomNav:{position:"absolute",left:0,right:0,bottom:0,height:82,backgroundColor:"#090B11",borderTopWidth:1,borderTopColor:"#222631",flexDirection:"row",justifyContent:"space-around",paddingTop:8,paddingBottom:10},
  navItem:{alignItems:"center",justifyContent:"center",width:"25%"},
  navIcon:{fontSize:21,color:"#737988",height:28},
  navLabel:{fontSize:10,color:"#737988",fontWeight:"700"},
  navActive:{color:GOLD}
});
