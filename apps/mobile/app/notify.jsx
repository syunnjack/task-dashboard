import { useState } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import * as Notifications from 'expo-notifications'
import { SafeAreaView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { brands } from '../src/brands.js'
import { registerExpoPush } from '../src/pushApi.js'

export default function Notify(){
  const {brand:slug}=useLocalSearchParams()
  const brand=brands.find((item)=>item.slug===slug)??brands[0]
  const [alternatives,setAlternatives]=useState(true)
  const [offers,setOffers]=useState(false)
  const [saved,setSaved]=useState(false)
  const [message,setMessage]=useState('')
  const register=async()=>{
    try{
      await registerExpoPush({facilityId:'demo-sauna',threshold:40,offers})
      await Notifications.scheduleNotificationAsync({content:{title:`${brand.name} 空き通知`,body:'混雑度が40%以下になったらお知らせします。'},trigger:null})
      setSaved(true);setMessage('この端末へ空き通知を配信します。')
    }catch(error){
      setSaved(false)
      setMessage(error.message==='permission_denied'?'端末の通知を許可してください。':error.message==='api_not_configured'?'通知APIの接続先が未設定です。':'通知登録の設定を確認してください。')
    }
  }
  return <SafeAreaView style={styles.safe}><View style={styles.page}><TouchableOpacity onPress={()=>router.back()}><Text style={styles.back}>← 戻る</Text></TouchableOpacity><Text style={[styles.kicker,{color:brand.primary}]}>SMART ALERT</Text><Text style={styles.title}>空いた瞬間だけ、{`\n`}お知らせ。</Text><View style={styles.card}><Text style={styles.label}>通知する混雑度</Text><Text style={styles.value}>40%以下</Text><View style={styles.rule}/><View style={styles.row}><Text>近くの代替候補も通知</Text><Switch value={alternatives} onValueChange={setAlternatives} trackColor={{true:brand.primary}}/></View><View style={styles.row}><Text>限定クーポンを受け取る</Text><Switch value={offers} onValueChange={setOffers} trackColor={{true:brand.primary}}/></View><TouchableOpacity style={[styles.button,{backgroundColor:brand.primary}]} onPress={register}><Text style={styles.buttonText}>{saved?'通知登録済み':'この条件で通知を登録'}</Text></TouchableOpacity>{message?<Text style={styles.message}>{message}</Text>:null}</View><Text style={styles.note}>通知条件は端末に保存されます。位置履歴は保存しません。</Text></View></SafeAreaView>
}

const styles=StyleSheet.create({safe:{flex:1,backgroundColor:'#f2f3ed'},page:{padding:24},back:{fontSize:12,fontWeight:'700',marginBottom:50},kicker:{fontSize:10,fontWeight:'800',letterSpacing:1.5},title:{fontSize:40,fontWeight:'800',letterSpacing:-2,lineHeight:48,marginTop:12,marginBottom:35},card:{backgroundColor:'#fff',padding:22},label:{fontSize:11,color:'#707974'},value:{fontSize:30,fontWeight:'800',marginTop:7},rule:{height:1,backgroundColor:'#d2d7d0',marginVertical:20},row:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:12},button:{padding:17,marginTop:20},buttonText:{color:'#fff',fontSize:13,fontWeight:'800',textAlign:'center'},message:{fontSize:11,color:'#45504a',lineHeight:17,marginTop:12},note:{fontSize:10,color:'#707974',lineHeight:17,marginTop:14}})
