import { useMemo, useState } from 'react'
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { brands } from '../src/brands.js'

const zones=[{x:26,y:28,score:84},{x:63,y:22,score:48},{x:74,y:59,score:31},{x:36,y:70,score:67}]

function HeatMap({brand}){
  return <View style={styles.map}><Svg width="100%" height="100%"><Defs>{zones.map((z,i)=><RadialGradient id={`g${i}`} key={i}><Stop offset="0" stopColor={z.score>75?'#ec4646':z.score>50?'#ee9440':'#36b984'} stopOpacity=".75"/><Stop offset="1" stopColor="#fff" stopOpacity="0"/></RadialGradient>)}</Defs><Rect width="100%" height="100%" fill="#dde4da"/>{zones.map((z,i)=><Circle key={i} cx={`${z.x}%`} cy={`${z.y}%`} r="24%" fill={`url(#g${i})`}/>)}</Svg>{zones.map((z,i)=><View key={i} style={[styles.pin,{left:`${z.x}%`,top:`${z.y}%`,backgroundColor:i===0?brand.accent:'#17211d'}]}><Text style={[styles.pinText,i===0&&{color:'#17211d'}]}>{z.score}</Text></View>)}</View>
}

export default function Home(){
  const [brandIndex,setBrandIndex]=useState(0)
  const brand=brands[brandIndex]
  const available=useMemo(()=>zones.filter((z)=>z.score<60),[])
  return <SafeAreaView style={[styles.safe,{backgroundColor:'#f2f3ed'}]}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.header}><View><Text style={[styles.kicker,{color:brand.primary}]}>#{String(brand.rank).padStart(2,'0')} · {brand.category}</Text><Text style={styles.logo}>{brand.name}</Text></View><TouchableOpacity onPress={()=>setBrandIndex((brandIndex+1)%brands.length)}><Text style={styles.switch}>ブランド切替 ↻</Text></TouchableOpacity></View>
    <View style={[styles.hero,{backgroundColor:brand.primary}]}><Text style={styles.heroLabel}>現在の平均混雑度</Text><Text style={styles.heroScore}>58%</Text><Text style={styles.heroCopy}>空いている場所が {available.length} 件あります</Text></View>
    <Text style={styles.sectionTitle}>混雑ヒートマップ</Text><HeatMap brand={brand}/>
    <View style={styles.selected}><View><Text style={styles.muted}>選択中</Text><Text style={styles.selectedTitle}>{brand.zones[0]}</Text></View><View><Text style={[styles.available,{color:brand.primary}]}>空いています</Text><Text style={styles.muted}>待ち時間 約5分</Text></View></View>
    <TouchableOpacity style={[styles.cta,{backgroundColor:brand.accent}]} onPress={()=>router.push({pathname:'/notify',params:{brand:brand.slug}})}><Text style={styles.ctaText}>空いたら通知する</Text><Text style={styles.ctaText}>→</Text></TouchableOpacity>
    <Text style={styles.sectionTitle}>おすすめ30ブランド</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}>{brands.map((item,index)=><TouchableOpacity key={item.slug} style={[styles.brandChip,index===brandIndex&&{borderColor:item.primary,backgroundColor:'#fff'}]} onPress={()=>setBrandIndex(index)}><Text style={styles.chipRank}>{String(item.rank).padStart(2,'0')}</Text><Text style={styles.chipName}>{item.name}</Text><Text style={styles.chipCategory}>{item.category}</Text></TouchableOpacity>)}</ScrollView>
  </ScrollView></SafeAreaView>
}

const styles=StyleSheet.create({safe:{flex:1},content:{padding:20,paddingBottom:60},header:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:20},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1},logo:{fontSize:20,fontWeight:'800'},switch:{fontSize:11,fontWeight:'700'},hero:{padding:24,minHeight:180,justifyContent:'flex-end'},heroLabel:{color:'#ffffffaa',fontSize:11},heroScore:{color:'#fff',fontSize:64,fontWeight:'800',letterSpacing:-4},heroCopy:{color:'#fff',fontSize:12},sectionTitle:{fontSize:20,fontWeight:'800',marginTop:30,marginBottom:14},map:{height:330,position:'relative',overflow:'hidden'},pin:{position:'absolute',width:42,height:42,borderRadius:21,marginLeft:-21,marginTop:-21,borderWidth:2,borderColor:'#fff',alignItems:'center',justifyContent:'center'},pinText:{color:'#fff',fontWeight:'800',fontSize:11},selected:{backgroundColor:'#fff',padding:18,flexDirection:'row',justifyContent:'space-between'},muted:{fontSize:10,color:'#77807b'},selectedTitle:{fontWeight:'800',fontSize:17,marginTop:4},available:{fontSize:12,fontWeight:'800',textAlign:'right'},cta:{padding:17,flexDirection:'row',justifyContent:'space-between',marginTop:10},ctaText:{fontWeight:'800',fontSize:13},brandChip:{width:150,padding:15,marginRight:10,borderWidth:1,borderColor:'#d4d8d1'},chipRank:{fontSize:9,color:'#7c8580'},chipName:{fontSize:13,fontWeight:'800',marginTop:15},chipCategory:{fontSize:9,color:'#737c77',marginTop:3}})
