import React, { Component } from 'react';
import L from 'leaflet';
import {Map, Marker, Popup, TileLayer, Polyline} from 'react-leaflet';
import RMarker from './RMarker';

var smallVehicleIcon = L.icon({
    iconUrl: "img/car_above.png", iconSize: [16, 32], iconAnchor: [8, 16]
});
var midVehicleIcon = L.icon({
    iconUrl: "img/car_above.png", iconSize: [32, 64], iconAnchor: [16, 32]
});
var largeVehicleIcon = L.icon({
    iconUrl: "img/car_above.png", iconSize: [64, 128], iconAnchor: [32, 64]
});

var smallBusIcon = L.icon({
    iconUrl: "img/bus_above_active.png", iconSize: [16, 32], iconAnchor: [8, 16]
});
var midBusIcon = L.icon({
    iconUrl: "img/bus_above_active.png", iconSize: [32, 64], iconAnchor: [16, 32]
});
var largeBusIcon = L.icon({
    iconUrl: "img/bus_above_active.png", iconSize: [64, 128], iconAnchor: [32, 64]
});

var smallTrainIcon = L.icon({
    iconUrl: "img/train_above.png", iconSize: [16, 32], iconAnchor: [8, 16]
});
var midTrainIcon = L.icon({
    iconUrl: "img/train_above.png", iconSize: [32, 64], iconAnchor: [16, 32]
});
var largeTrainIcon = L.icon({
    iconUrl: "img/train_above.png", iconSize: [64, 128], iconAnchor: [32, 64]
});


export default class LeafletMap extends Component {
    constructor(props) {
        super(props)
        this.vehicleIcon = midVehicleIcon;
        this.busIcon = midBusIcon;
        this.trainIcon = midTrainIcon;
        this.mapRef = React.createRef()
    }


    componentDidMount() {
        console.log(this.mapRef) 
        // this.interval = setInterval(() => this.addDemo(), 1000);
    }

    componentWillUnmount() {
        // clearInterval(this.interval)
    }

    componentWillReceiveProps(nextProps) {
        // console.log("Content:willUpdate");
        this.setState(nextProps);
    }

    isAssignedKeyInToio(key, characteristics){
        for(let i = 0; i < characteristics.length; ++i){
            if(characteristics[i].packerID == key){
                return true;
            }
        }
        return false;
    }

    searchToioIndex(key, characteristics){
        for(let i = 0; i < characteristics.length; ++i){
            if(characteristics[i].packerID == key){
                return i;
            }
        }
        return null;
    }

    //todo：空いているtoioを探して、あればcharacteristicsのindexを返却。なければnullを返却。
    findVacantToio(characteristics){
        for(let i = 0; i < characteristics.length; ++i){
            if(characteristics[i].packerID == null){
                return i
            }
        }
        return null
    }

    //todo：与えられた緯度経度をtoio座標系に変換して返却する
    convLatLonTOToioCoordinate(lat, lon){
        return [parseInt(-11341.1478*lat+398985.4461), parseInt(10947.8571*lon-1499948.53106)];
    }

    //todo：toioを指定場所に移動させる
    async moveToio(lat, lon, toioIndex, cp){
        let toioCoordinate = this.convLatLonTOToioCoordinate(lat, lon);
        const buffer = Buffer.alloc(13)
        buffer.writeUInt8(3, 0)
        buffer.writeUInt8(0, 1)
        buffer.writeUInt8(5, 2)
        buffer.writeUInt8(2, 3)
        buffer.writeUInt8(60, 4)
        buffer.writeUInt8(0, 5)
        buffer.writeUInt8(0, 6)
        buffer.writeUInt16LE(toioCoordinate[0],7)
        buffer.writeUInt16LE(toioCoordinate[1],9)
        buffer.writeUInt16LE(90,11)

        await cp.props.characteristics[toioIndex].characteristic.writeValue(Buffer.from(buffer));
    }


    render() {
        const position = [34.8594, 137.1720];
        let ms = []

        const bounds = [[35.177343, 137.011519], [35.098515, 137.095097]]

        if(this.props.taxi){
            let toioIndex = 0;
            let vs = this.props.store.getVehicle(0); // Car should be ..0
            let cs = this.props.characteristics
            let cp = this
            // console.log(this)
            Object.keys(vs).forEach(function (key) {

                // このkeyを持つ清掃車がすでにtoioに割り当てられているかチェック
                if(cp.isAssignedKeyInToio(key, cs)){
                    //todo：BLEでpositionを飛ばす処理を記述
                    console.log("send position info to toio.")
                    cp.moveToio(vs[key][0][0], vs[key][0][1], cp.searchToioIndex(key, cs), cp);
                    ms.push(
                        <RMarker
                            position={[vs[key][0][0],vs[key][0][1]]}
                            icon={midVehicleIcon}
                            rotationOrigin={(midVehicleIcon.options.iconAnchor[0] + 'px ' + midVehicleIcon.options.iconAnchor[1] + 'px')}
                            rotationAngle ={[vs[key][0][2]]}
                        />
                    );
                }
                // 割当がまだ かつ toioに空きがあれば割り当てる
                else if(cp.findVacantToio(cs) !== null){
                    //todo：割り当てを行う、setState、BLEでposition飛ばす
                    toioIndex =  cp.findVacantToio(cs);
                    cp.props.characteristics[toioIndex].packerID = key;
                    console.log(cp.props.characteristics[toioIndex].packerID);
                    console.log("toio is assigned")
                }
            });
        }
        if( this.props.bus){
            let vs = this.props.store.getVehicle(3);
            Object.keys(vs).forEach(function (key) {
                ms.push(
                    <RMarker
                        position={[vs[key][0][0],vs[key][0][1]]}
                        icon={midBusIcon}
                        rotationOrigin={(midBusIcon.options.iconAnchor[0] + 'px ' + midBusIcon.options.iconAnchor[1] + 'px')}
                        rotationAngle ={[vs[key][0][2]]}
                    />
                )
            });
        }
        if(this.props.busTrace){
            let vs = this.props.store.getVehicle(3);
            Object.keys(vs).forEach(function (key) {

                let vec = vs[key]
                let arr = []
                vec.forEach(function (arg){
                    arr.push([arg[0],arg[1]])
                })
                ms.push(
                    <Polyline
                        positions={arr}
                    />
                )
            });
        }
        if( this.props.train){
            let vs = this.props.store.getVehicle(2);
            Object.keys(vs).forEach(function (key) {
                ms.push(
                    <RMarker
                        position={[vs[key][0][0],vs[key][0][1]]}
                        icon={midTrainIcon}
                        rotationOrigin={(midTrainIcon.options.iconAnchor[0] + 'px ' + midTrainIcon.options.iconAnchor[1] + 'px')}
                        rotationAngle ={[vs[key][0][2]]}
                    />
                )
            });
        }


        let markers = <div></div>;
        if(ms.length > 0){
            markers = ms;
        }
        
        const map = (
            <Map center={position} zoom={13} bounds={bounds} ref={this.mapRef}>
                <TileLayer
                    url = "https://tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png"
                    attribution ="&copy; <a href=&quot;http://osm.org/copyright&quot;>OpenStreetMap</a> contributors"
                />
                {markers}
            </Map>
        )

        console.log(this.mapRef) // =>null

        return (
            <section className="content">
                {map}
            </section>
        );
    }
}

// test