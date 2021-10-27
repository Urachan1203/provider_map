import React, { Component } from 'react';
import Header from './component/Header';
import SideBar from './component/SideBar';
import SelectContent from './component/SelectContent';
import MsgStore from './model/MsgStore';
//import HarmoMap from './component/HarmoMap';
import LeafletMap from './component/LeafletMap';
import io from 'socket.io-client';


class App extends Component {

    characteristics = [];

    constructor(props) {
        super(props);
        const socket = io();
        this.mstore = new MsgStore();
        this.state = {
            store: this.mstore,
            bus: true,
            busTrace: true,
            taxi: true,
            train: true
        }
        socket.on('connect', () => { console.log("Socket.IO Connected!") });
        socket.on('event', this.getEvent.bind(this));
        socket.on('disconnect', () => { console.log("Socket.IO Disconnected!") });

 //       this.selComp =HarmoMap;
//        this.selComp =WorldView;
        this.selComp =LeafletMap;
        this.selArg =  {
            store:this.state.store,
            bus: this.state.bus,
            busTrace: this.state.busTrace,
            taxi: this.state.taxi,
            train: this.state.train
        };

        
    }

    getEvent(data){
//        console.log("GetEvent:", data);
        // Parse Message

        this.mstore.addPosition(data)
        this.setState({
            store:this.mstore
        })
    }

    resetView() {
        this.setState({
            reset:true
        });
        this.selArg.reset = true;
    }


    showBus(){
        this.setState({
            bus:!this.state.bus
        });
        this.selArg.bus = this.state.bus;
    }
    showBusTrace(){
        this.setState({
            busTrace:!this.state.busTrace
        });
        this.selArg.busTrace = this.state.busTrace;
    }


    showTaxi(){
        this.setState({
            taxi:!this.state.taxi
        });
        this.selArg.taxi = this.state.taxi;
    }
    showTrain(){
        this.selArg.train = !this.state.train
        this.setState({
            train:this.selArg.train
        });
    }

    componentDidMount(){
//        this.interval = setInterval(() => this.addDemo(), 5000);
    }

//! toioとBLE接続
    async connectToToio(){
        const TOIO_SERVICE_UUID = "10b20100-5b3b-4571-9508-cf3efcd7bbae";
        const MOTOR_CHARACTERISTIC_UUID = "10b20102-5b3b-4571-9508-cf3efcd7bbae";
        
        const device = await navigator.bluetooth.requestDevice({
                filters: [{ services: [TOIO_SERVICE_UUID] }],
        });
        const server = await device.gatt.connect();
        const service = await server.getPrimaryService(TOIO_SERVICE_UUID);
        const characteristic = await service.getCharacteristic(MOTOR_CHARACTERISTIC_UUID);

        this.characteristics.push(characteristic)

        console.log("connected!")
    }


    render() {
        const header =  <Header />;
        const sidebar = <SideBar clearLogs={() => this.clearLogs()}
        showBus={()=>this.showBus()}
        showBusTrace={()=>this.showBusTrace()}
        showTaxi={()=>this.showTaxi()}
        showTrain={()=>this.showTrain()}
        resetView={()=>this.resetView()}
        connectToToio={()=>this.connectToToio()}
        />;
        const content = <SelectContent component={this.selComp}  args={this.selArg}/>;
        return (
            <div>
            {header}
        {sidebar}
        {content}
    </div>
    );
    }
}

export default App;