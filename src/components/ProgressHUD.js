import React, {Component} from 'react'
import {ActivityIndicator, Text, View} from 'react-native'

export default class ProgressHUD extends Component {
    render() {
        const {width, height, isVisible} = this.props
        if (isVisible) {
            return (
                <View
                    style={{
                        flex: 1,
                        flexDirection: 'row',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: width,
                        height: height,
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)'
                    }}>
                    <ActivityIndicator
                        animating={true}
                        color={'#fff'}
                        size={'large'}
                        style={{margin: 15}}/>
                    <Text style={{color: '#fff'}}>Downloading...</Text>
                </View>

            )
        } else {
            return (<View/>);
        }
    }
}
