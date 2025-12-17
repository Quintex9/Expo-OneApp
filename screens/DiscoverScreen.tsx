import { StyleSheet, Platform, Image, Text, View, Pressable } from "react-native";
import { useEffect, useRef, useState,useMemo } from "react";
import Mapbox, {
  MarkerView,
  MapView,
  Camera,
  UserTrackingMode,
  LocationPuck,
  UserLocation,
} from "@rnmapbox/maps";
import { NEXT_PUBLIC_MAPBOX_TOKEN } from "@env";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { coords } from "../lib/data/coords";
import { ScrollView, TextInput, TouchableOpacity } from "react-native-gesture-handler";
import BottomSheet from "@gorhom/bottom-sheet";
import { SearchBar } from "react-native-screens";
import BranchCard from "../components/BranchCard";
import FavoriteBranchesScreen from "./FavoriteBranchesScreen";


Mapbox.setAccessToken(NEXT_PUBLIC_MAPBOX_TOKEN);

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();

  const sheetRef = useRef<BottomSheet>(null);
  const filterRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => [200,650],[]);

  const filter_options = ["Fitness","Gastro","Relax","Beauty"];
  const filter_icons:Record<string,any> = {
    Fitness: require("../images/icons/fitness/Fitness.png"),
    Gastro: require("../images/icons/gastro/Gastro.png"),
    Relax: require("../images/icons/relax/Relax.png"),
    Beauty: require("../images/icons/beauty/Beauty.png"),

  }

  const subcategories = ["Vegan","Coffee","Asian","Pizza","Sushi","Fast Food","Seafood","Beer"];


  const options = [
    { icon: require("../images/home.png"), label: "Home" },
    { icon: require("../images/business.png"), label: "Business" }, 
  ];

  const [open, setOpen] = useState(false);
  const [option, setOption] = useState<string>("Your Location"); 
  const [text,setText] = useState("");
  const [o,setO] = useState<boolean>(true)
  const [filter,setFilter] = useState("Gastro")
  const [sub,setSub] = useState<Set<string>>(()=>new Set());

  const toggle = (name: string) => {
    setSub(prev => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  useEffect(() => {
    if (Platform.OS === "android") {
      Mapbox.requestAndroidLocationPermissions();
    }
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <MapView style={styles.map} styleURL={Mapbox.StyleURL.Street} scaleBarEnabled={false}>
        <Camera
          centerCoordinate={[18.091, 48.3069]}
          followUserLocation={true}
          followUserMode={UserTrackingMode.Follow}
          followZoomLevel={14}
        />

        <UserLocation visible />

        <LocationPuck
          topImage={Image.resolveAssetSource(require("../images/navigation.png")).uri}
          visible={true}
          scale={["interpolate", ["linear"], ["zoom"], 10, 1.0, 20, 4.0]}
          pulsing={{
            isEnabled: true,
            color: "teal",
            radius: 50.0,
          }}
        />

        <MarkerView coordinate={[coords[0].lng, coords[0].lat]} anchor={{ x: 0.5, y: 1 }}>
          <Image source={require("../images/icons/fitness/fitness_without_review.png")} style={styles.icon} />
        </MarkerView>

        <MarkerView coordinate={[coords[1].lng, coords[1].lat]} anchor={{ x: 0.5, y: 1 }}>
          <Image source={require("../images/icons/gastro/gastro_without_rating.png")} style={styles.icon} />
        </MarkerView>

        <MarkerView coordinate={[coords[2].lng, coords[2].lat]} anchor={{ x: 0.5, y: 1 }}>
          <Image source={require("../images/icons/relax/relax_without_rating.png")} style={styles.icon} />
        </MarkerView>

        <MarkerView coordinate={[coords[3].lng, coords[3].lat]} anchor={{ x: 0.5, y: 1 }}>
          <Image source={require("../images/icons/beauty/beauty_without_rating.png")} style={styles.icon} />
        </MarkerView>
      </MapView>


      <View style={[styles.dropdown_main, { top: insets.top + 8 }]} pointerEvents="box-none">
      
        {open && <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />}

    
        <View style={styles.card}>
        
          {o && <TouchableOpacity style={styles.row} onPress={() => setOpen((prev) => !prev)} activeOpacity={0.85}>
            <Image source={require("../images/pin.png")} style={styles.rowIcon} resizeMode="contain" />
            <Text style={styles.rowTextBold}>{option}</Text>

            <Image
              source={require("../images/options.png")}
              style={[styles.caret, open && styles.caretOpen]}
              resizeMode="contain"
            />
          </TouchableOpacity>}

  
          {open && (
            <View style={styles.menu}>
              {options.map((opt) => (
                <TouchableOpacity
                  key={opt.label}
                  style={styles.menuRow}
                  onPress={() => {
                    setOption(opt.label);
                    setOpen(false);
                  }}
                  activeOpacity={0.85}
                >
                  <Image source={opt.icon} style={styles.rowIcon} resizeMode="contain" />
                  <Text style={styles.rowText}>{opt.label}</Text>
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.menuRow} onPress={() => setOpen(false)} activeOpacity={0.85}>
                <Text style={styles.plus}>+</Text>
                <Text style={styles.rowText}>Add Location</Text>
              </TouchableOpacity>
            </View>
          )}

        </View>

        <View style={styles.actionsRow} pointerEvents="auto">
          {o && <TouchableOpacity style={{    width: 44,
                                              height: 44,
                                              borderRadius: 15,
                                              backgroundColor: "white",
                                              alignItems: "center",
                                              justifyContent: "center",

                                              shadowColor: "#000",
                                              shadowOpacity: 0.12,
                                              shadowRadius: 10,
                                              shadowOffset: { width: 0, height: 5 },
                                              elevation: 8,
                                              opacity: o ? 1: 0}} activeOpacity={0.85} onPress={() => {
                                                
                                                setO(false);
                                                sheetRef.current?.snapToIndex(1);

                                              }}>

            <Image source={require("../images/search.png")} />

          </TouchableOpacity>}



          {o && <TouchableOpacity style={styles.roundBtn} activeOpacity={0.85} onPress={()=> filterRef.current?.snapToIndex(1)}>
            <Image source={require("../images/filter.png")} />
          </TouchableOpacity>}

          {o && <TouchableOpacity style={styles.roundBtn} activeOpacity={0.85}>
            <Image source={require("../images/navigation.png")} />
          </TouchableOpacity>}
        </View>
      </View>

      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose={true}
        onChange={(index) =>setO(index===-1)}
      >
              <View style={styles.searchField}>
                <Image source={require("../images/search.png")} style={{marginRight:5}}></Image>
                <TextInput
                value={text}
                onChangeText={setText}
                placeholder="Search branches..."

                >
                  

                </TextInput>
              </View>

          
          <FavoriteBranchesScreen></FavoriteBranchesScreen>
         
      </BottomSheet>

      <BottomSheet
      ref={filterRef}
      index={-1}
      snapPoints={snapPoints}
      enablePanDownToClose={true}
      onChange={(index) =>setO(index===-1)}>
      
          <View style={styles.filter_main}>

            <View style = {styles.filter_header}>
              <Text style={{fontSize:20,fontWeight:"bold",marginLeft:10}}>Filters</Text>
              <Text style={{fontSize:14, color:"gray"}}>Reset</Text>
            </View>

            <View style = {styles.filter_categories}>

              

                <Text style={{fontSize:20,fontWeight:"bold",marginLeft:10,marginTop:22}}>Categories</Text>

                <View style={{flexDirection:"row"}}>

                <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                >
                  {filter_options.map((option) =>(
                    <TouchableOpacity style={{flexDirection:"row",backgroundColor: filter === option? "#EB8100":"#FFFFFF", borderRadius:20,padding:15,borderWidth: 1,
    borderColor: "#eee", gap:10,marginRight:10,marginTop:10, width:125,marginLeft: 9,}} onPress={() =>setFilter(option)} key={option}>
                      <Image source={(filter_icons[option])}></Image>
                      <Text style={{fontWeight:"600", fontSize:16,marginLeft:5,color: filter === option?"white":"black"}}>{option}</Text>
                    </TouchableOpacity>
                  ))}

                </ScrollView>

              </View>
            </View>

            <View>
              <Text style={{fontSize:20,fontWeight:"bold",marginLeft:10,marginTop:25,marginBottom:10}}>{filter} subcategories</Text>

                  <View style={{flexDirection:"row", flexWrap:"wrap"}}>

                  {subcategories.map((subs) => {
                  const active = sub.has(subs);

                  return (
                    <TouchableOpacity
                      key={subs}
                      onPress={() => toggle(subs)}
                      activeOpacity={0.85}
                      style={{
                        borderRadius: 20,
                        padding: 15,
                        borderWidth: 1,
                        borderColor: active ? "transparent" : "#eee",
                        backgroundColor: active ? "#EB8100" : "#FFFFFF",
                        marginLeft: 9,
                        marginTop: 10,
                        width: 125,
                        justifyContent: "center",
          
                      }}
                    >
                      <Text style={{ fontWeight: "600", fontSize: 16, color: active ? "white" : "black", textAlign: "center" }}>
                        {subs}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                  </View>

                <View>
                  <TouchableOpacity style={{
                        borderRadius: 20,
                        padding: 15,
                        borderWidth: 1,
                        backgroundColor:"#EB8100",
                        marginLeft: 10,
                        marginTop: 130,
                        width: "95%",
                        justifyContent: "center",
                        borderColor:"#eee",
        
                      
                      }}>
                        
                        <Text style={{ fontWeight: "bold", fontSize: 18,color:"white",textAlign:"center"}}> Filter</Text></TouchableOpacity>
                      </View>

            </View>


          </View>
          
      </BottomSheet>


    </SafeAreaView>
  );
}

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  map: { flex: 1, width: "100%" },

  icon: { width: 64, height: 64 },

  dropdown_main: {
    position: "absolute",
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    zIndex: 10,
  },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  searchField:{
    flexDirection:"row",
    alignContent:"center",
    padding:15,
    backgroundColor:"white",
    borderRadius:25,
    elevation: 1,
    borderWidth: 1,
    borderColor: "#eee",
    width:381,
    height:48,
    marginLeft:14,
    gap:5,
    marginBottom:20
  },
  card: {
    width: 210,
    backgroundColor: "white",
    borderRadius: 18,
    overflow: "hidden",
    zIndex: 2,

   
    shadowColor: "#000",
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },

   
    elevation: 10,
  },

  
  row: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  menu: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6E6E6",
  },

  menuRow: {
    height: 44,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E6E6E6",
    backgroundColor: "white",
  },

  rowIcon: { width: 18, height: 18 },

  rowTextBold: { flex: 1, fontWeight: "700" },
  rowText: { flex: 1, fontWeight: "500" },

  caret: { width: 16, height: 16, opacity: 0.7 },
  caretOpen: { transform: [{ rotate: "180deg" }] },

  plus: { width: 18, textAlign: "center", fontSize: 18, fontWeight: "600" },

  actionsRow: {
    flexDirection: "row",
    gap: 12,
    zIndex: 2,
  },

  roundBtn: {
    width: 44,
    height: 44,
    borderRadius: 15,
    backgroundColor: "white",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
  },
      container_2: {
        flex: 1,
        backgroundColor: "#fff",
        paddingHorizontal: 20,
    },

    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginTop: 10,
        marginBottom: 20,
    },

    title: {
        fontSize: 18,
        fontWeight: "600",
    },

    filter_main:{
      flex:1,
      flexDirection:"column",
    },
    filter_header:{
      flexDirection:"row",
      gap:295,
      height:50,
      width:"100%",
      alignItems:"center",
      borderBottomWidth:0.2,
      borderColor:"#E5E7EB",
      paddingBottom:10,

    },
    filter_categories:{
      flexDirection:"column",
      width:"100%",
      paddingBottom:10,

    },
});
