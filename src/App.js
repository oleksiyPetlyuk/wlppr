import React, {Component} from 'react'
import {Alert, CameraRoll, Dimensions, PanResponder, StyleSheet, Text, View} from 'react-native'
import Swiper from 'react-native-swiper'
import NetworkImage from 'react-native-image-progress'
import ProgressHUD from "./components/ProgressHUD"
import Unsplash, {toJson} from 'unsplash-js/native'

const Utils = require('./Utils')
const Spinner = require('react-native-spinkit')

const DOUBLE_TAP_DELAY = 300 // milliseconds
const DOUBLE_TAP_RADIUS = 20

const NUMBER_OF_PHOTOS_TO_LOAD = 10
const PHOTOS_ORIENTATION = 'portrait'

const {width, height} = Dimensions.get('window')

export default class App extends Component {
    state = {
        photos: [],
        isLoading: true,
        isHudVisible: false
    }

    constructor(props) {
        super(props)

        this.imagePanResponder = {}

        this.prevTouchInfo = {
            prevTouchX: 0,
            prevTouchY: 0,
            prevTouchTimeStamp: 0
        }

        this.currentPhotoIndex = 0

        this.unsplash = new Unsplash({
            applicationId: "f82aece6a14929f844cc037ca5faff75fcb4b5041ea64d5f0f8e8a72764ee84a",
            secret: "c7e7e78acc35904ce676771d4c77b856439c788786315a7e84e277b997b58db7"
        })
    }

    fetchPhotos = () => {
        this.unsplash.photos.getRandomPhoto({count: NUMBER_OF_PHOTOS_TO_LOAD, orientation: PHOTOS_ORIENTATION})
            .then(toJson)
            .then(json => {
                this.setState((prevState) => ({
                    isLoading: false,
                    photos: prevState.photos.concat(json)
                }))
            })
            .catch(error => console.log('Fetch walls error ' + error))
    }

    onMomentumScrollEnd = (index) => {
        this.currentPhotoIndex = index
        const {photos} = this.state

        // load new photos when the only 2 already loaded left
        if (photos.length - this.currentPhotoIndex < 3) {
            this.fetchPhotos();
        }
    }

    saveCurrentPhotoToCameraRoll = () => {
        this.setState({isHudVisible: true})

        const {photos} = this.state
        const currentPhoto = photos[this.currentPhotoIndex]

        CameraRoll.saveToCameraRoll(currentPhoto.urls.raw)
            .then(data => {
                this.unsplash.photos.downloadPhoto(currentPhoto)

                this.setState({isHudVisible: false})

                Alert.alert(
                    'Saved',
                    'Wallpaper successfully saved to Camera Roll',
                    [
                        {text: 'OK'}
                    ]
                )
            })
            .catch(err => console.log('Error saving to camera roll', err))
    }

    isDoubleTap = (currentTouchTimeStamp, {x0, y0}) => {
        const {prevTouchX, prevTouchY, prevTouchTimeStamp} = this.prevTouchInfo
        const dt = currentTouchTimeStamp - prevTouchTimeStamp

        return (dt < DOUBLE_TAP_DELAY && Utils.distance(prevTouchX, prevTouchY, x0, y0) < DOUBLE_TAP_RADIUS)
    }

    handleStartShouldSetPanResponder = (e, gestureState) => {
        return true
    }

    handlePanResponderGrant = (e, gestureState) => {
        const currentTouchTimeStamp = Date.now()

        if (this.isDoubleTap(currentTouchTimeStamp, gestureState)) {
            this.saveCurrentPhotoToCameraRoll()
        }

        this.prevTouchInfo = {
            prevTouchX: gestureState.x0,
            prevTouchY: gestureState.y0,
            prevTouchTimeStamp: currentTouchTimeStamp
        }
    }

    handlePanResponderEnd = (e, gestureState) => {
        //
    }

    componentWillMount() {
        this.imagePanResponder = PanResponder.create({
            onStartShouldSetPanResponder: this.handleStartShouldSetPanResponder,
            onPanResponderGrant: this.handlePanResponderGrant,
            onPanResponderRelease: this.handlePanResponderEnd,
            onPanResponderTerminate: this.handlePanResponderEnd
        })
    }

    componentDidMount() {
        this.fetchPhotos()
    }

    renderLoadingMessage = () => {
        return (
            <View style={styles.loadingContainer}>
                <Spinner style={styles.spinner}
                         type={'ThreeBounce'}
                         color={styles.spinner.color}/>
            </View>
        )
    }

    renderResults = () => {
        const {photos, isLoading, isHudVisible} = this.state

        if (!isLoading) {
            return (
                <View style={{flex: 1}}>
                    <Swiper loop={false}
                            index={this.currentPhotoIndex}
                            showsPagination={false}
                            onIndexChanged={this.onMomentumScrollEnd}>
                        {photos.map((photo, index) => {
                            return (
                                <View key={index} style={{flex: 1}}>
                                    <NetworkImage
                                        source={{uri: photo.urls.regular}}
                                        renderIndicator={this.renderLoadingMessage}
                                        style={styles.wallpaperImage}
                                        {...this.imagePanResponder.panHandlers}>
                                        <Text style={styles.label}>Photo by</Text>
                                        <Text style={styles.label_authorName}>{photo.user.name}</Text>
                                    </NetworkImage>
                                </View>
                            )
                        })}
                    </Swiper>
                    <ProgressHUD width={width} height={height} isVisible={isHudVisible}/>
                </View>
            )
        }
    }

    render() {
        const {isLoading} = this.state

        if (isLoading) {
            return this.renderLoadingMessage()
        } else {
            return this.renderResults()
        }
    }
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
    },
    spinner: {
        color: '#fff'
    },
    wallpaperImage: {
        flex: 1,
        width: width,
        height: height,
        backgroundColor: '#000'
    },
    label: {
        position: 'absolute',
        color: '#fff',
        fontSize: 13,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 2,
        paddingLeft: 5,
        top: 35,
        left: 20,
        width: width / 2
    },
    label_authorName: {
        position: 'absolute',
        color: '#fff',
        fontSize: 15,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 2,
        paddingLeft: 5,
        top: 56,
        left: 20,
        fontWeight: 'bold',
        width: width / 2
    }
})
